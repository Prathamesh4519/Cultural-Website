import fs from 'fs';
import path from 'path';

// Local database directory
const DATA_DIR = path.resolve('data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read data from local JSON file
const readData = (collectionName) => {
  const filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error(`Error reading ${collectionName} data:`, err);
    return [];
  }
};

// Helper to write data to local JSON file
const writeData = (collectionName, data) => {
  const filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${collectionName} data:`, err);
  }
};

// Simple ID Generator
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Query Evaluator emulating Mongoose/MongoDB query filters
const evaluateQuery = (doc, query) => {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, filter] of Object.entries(query)) {
    // 1. $or Operator
    if (key === '$or') {
      if (!Array.isArray(filter)) continue;
      const matchAny = filter.some(q => evaluateQuery(doc, q));
      if (!matchAny) return false;
      continue;
    }

    // 2. Exact match check
    if (filter === null || typeof filter !== 'object' || filter instanceof Date) {
      const docVal = doc[key] instanceof Date ? doc[key].toISOString() : doc[key];
      const filterVal = filter instanceof Date ? filter.toISOString() : filter;

      // Handle simple string comparisons (e.g. ObjectId cast)
      if (docVal?.toString() !== filterVal?.toString()) {
        return false;
      }
      continue;
    }

    // 3. Operators: $in, $gte, $lt, $ne
    for (const [op, val] of Object.entries(filter)) {
      if (op === '$in') {
        if (!Array.isArray(val)) return false;
        const arrayVal = Array.isArray(doc[key]) ? doc[key] : [doc[key]];
        const match = arrayVal.some(item => val.map(v => v?.toString()).includes(item?.toString()));
        if (!match) return false;
      } else if (op === '$gte') {
        const docDate = new Date(doc[key]).getTime();
        const compareDate = new Date(val).getTime();
        if (isNaN(docDate) || isNaN(compareDate)) {
          if (doc[key] < val) return false;
        } else {
          if (docDate < compareDate) return false;
        }
      } else if (op === '$lt') {
        const docDate = new Date(doc[key]).getTime();
        const compareDate = new Date(val).getTime();
        if (isNaN(docDate) || isNaN(compareDate)) {
          if (doc[key] >= val) return false;
        } else {
          if (docDate >= compareDate) return false;
        }
      } else if (op === '$ne') {
        if (doc[key]?.toString() === val?.toString()) {
          return false;
        }
      }
    }
  }
  return true;
};

// Query Builder emulating Mongoose Query interface
class Query {
  constructor(collectionName, query = {}, model) {
    this.collectionName = collectionName;
    this.query = query;
    this.model = model;
    this._sort = null;
    this._limit = null;
    this._populates = [];
  }

  populate(path, select) {
    this._populates.push({ path, select });
    return this;
  }

  sort(criteria) {
    this._sort = criteria;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  select(fields) {
    return this;
  }

  // Executes query
  async exec() {
    let list = readData(this.collectionName);
    
    // Filter
    list = list.filter(doc => evaluateQuery(doc, this.query));

    // Sort
    if (this._sort) {
      const keys = typeof this._sort === 'string' 
        ? [this._sort] 
        : Object.keys(this._sort);
      
      list.sort((a, b) => {
        for (const key of keys) {
          let desc = false;
          let prop = key;
          
          if (typeof this._sort === 'string') {
            if (key.startsWith('-')) {
              desc = true;
              prop = key.substring(1);
            }
          } else {
            desc = this._sort[key] === -1;
          }

          if (a[prop] < b[prop]) return desc ? 1 : -1;
          if (a[prop] > b[prop]) return desc ? -1 : 1;
        }
        return 0;
      });
    }

    // Limit
    if (this._limit !== null) {
      list = list.slice(0, this._limit);
    }

    // Convert list items to Document instances so pre-save / save / instance methods work
    const schema = schemas[this.collectionName];
    const docs = list.map(item => new Document(item, this.collectionName, schema));

    // Populate lookups
    for (const pop of this._populates) {
      for (const doc of docs) {
        const id = doc[pop.path];
        if (id) {
          // Detect model from schema field ref or guess
          let refModelName = '';
          const schemaDef = schema.definition[pop.path];
          if (schemaDef && schemaDef.ref) {
            refModelName = schemaDef.ref;
          } else if (Array.isArray(schemaDef) && schemaDef[0]?.ref) {
            refModelName = schemaDef[0].ref;
          }

          if (refModelName) {
            const refData = readData(refModelName);
            // Handle single ref vs array ref
            if (Array.isArray(id)) {
              doc[pop.path] = id.map(refId => {
                const match = refData.find(item => item._id === refId.toString());
                return match ? new Document(match, refModelName, schemas[refModelName]) : refId;
              });
            } else {
              const match = refData.find(item => item._id === id.toString());
              if (match) {
                doc[pop.path] = new Document(match, refModelName, schemas[refModelName]);
              }
            }
          }
        }
      }
    }

    return docs;
  }

  // Then handler for async-await compatibility
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

// Document Instance emulating Mongoose Document
class Document {
  constructor(data, collectionName, schema) {
    Object.assign(this, data);
    this._id = data._id || generateId();
    
    // Define hidden metadata
    Object.defineProperty(this, '_collectionName', { value: collectionName, enumerable: false });
    Object.defineProperty(this, '_schema', { value: schema, enumerable: false });

    // Attach instance methods from schema definitions
    if (schema && schema.methods) {
      Object.keys(schema.methods).forEach(methodName => {
        this[methodName] = schema.methods[methodName].bind(this);
      });
    }
  }

  isModified(path) {
    if (path === 'password') {
      if (this.password && this.password.startsWith('$2a$')) {
        return false;
      }
    }
    return true;
  }

  // Emulates document save (updates/adds details to local JSON db)
  async save() {
    const schema = this._schema;
    
    // Execute registered pre-save hooks (e.g. password bcrypt hashing)
    if (schema && schema.preHooks?.save) {
      for (const hook of schema.preHooks.save) {
        await new Promise((resolve, reject) => {
          hook.call(this, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }

    const dataList = readData(this._collectionName);
    const index = dataList.findIndex(item => item._id === this._id.toString());
    
    // Build serialized object (strip methods/getters)
    const serialized = this.toObject();

    if (index >= 0) {
      dataList[index] = serialized;
    } else {
      dataList.push(serialized);
    }

    writeData(this._collectionName, dataList);
    return this;
  }

  toObject() {
    const obj = {};
    for (const [key, val] of Object.entries(this)) {
      if (typeof val !== 'function') {
        // Deep copy sub-objects/arrays to avoid reference leaks
        if (val && typeof val === 'object' && !(val instanceof Date)) {
          if (Array.isArray(val)) {
            obj[key] = val.map(item => item instanceof Document ? item.toObject() : JSON.parse(JSON.stringify(item)));
          } else if (val instanceof Document) {
            obj[key] = val.toObject();
          } else {
            obj[key] = JSON.parse(JSON.stringify(val));
          }
        } else {
          obj[key] = val;
        }
      }
    }
    return obj;
  }

  toJSON() {
    return this.toObject();
  }
}

const schemas = {};

// Main emulated Mongoose Exports
const mongooseMock = {
  connect: async (uri, options) => {
    console.log(`[MOCK DB] Emulating connection to local JSON database folder: ${DATA_DIR}`);
    return { connection: { host: 'JSON_Local_Memory' } };
  },

  Schema: class Schema {
    constructor(definition) {
      this.definition = definition;
      this.methods = {};
      this.statics = {};
      this.preHooks = { save: [] };
    }
    
    pre(hookName, fn) {
      this.preHooks[hookName] = this.preHooks[hookName] || [];
      this.preHooks[hookName].push(fn);
    }
  },

  model: (modelName, schema) => {
    schemas[modelName] = schema;

    // Emulated Model class
    class Model {
      constructor(data) {
        return new Document(data, modelName, schema);
      }

      static find(query = {}) {
        return new Query(modelName, query, Model);
      }

      static findOne(query = {}) {
        const q = new Query(modelName, query, Model);
        const originalExec = q.exec.bind(q);
        q.exec = async () => {
          const results = await originalExec();
          return results.length > 0 ? results[0] : null;
        };
        return q;
      }

      static findById(id) {
        return Model.findOne({ _id: id });
      }

      static async create(data) {
        const list = Array.isArray(data) ? data : [data];
        const results = [];
        
        for (const item of list) {
          const doc = new Document(item, modelName, schema);
          await doc.save();
          results.push(doc);
        }

        return Array.isArray(data) ? results : results[0];
      }

      static async countDocuments(query = {}) {
        const q = new Query(modelName, query, Model);
        const results = await q.exec();
        return results.length;
      }

      static async insertMany(docs) {
        return await Model.create(docs);
      }

      static async findByIdAndDelete(id) {
        const list = readData(modelName);
        const index = list.findIndex(item => item._id === id.toString());
        if (index >= 0) {
          const deleted = list.splice(index, 1)[0];
          writeData(modelName, list);
          return new Document(deleted, modelName, schema);
        }
        return null;
      }

      static async findByIdAndUpdate(id, update, options = {}) {
        const doc = await Model.findById(id);
        if (!doc) return null;
        
        // Emulate simple field update
        const fields = update.$set || update;
        Object.assign(doc, fields);
        await doc.save();
        return doc;
      }

      static async updateMany(query, update) {
        const q = new Query(modelName, query, Model);
        const matches = await q.exec();
        const fields = update.$set || update;
        
        for (const doc of matches) {
          Object.assign(doc, fields);
          await doc.save();
        }
        return { modifiedCount: matches.length };
      }

      static async updateOne(query, update) {
        const doc = await Model.findOne(query);
        if (!doc) return { modifiedCount: 0 };
        const fields = update.$set || update;
        Object.assign(doc, fields);
        await doc.save();
        return { modifiedCount: 1 };
      }
    }

    return Model;
  }
};

// ObjectId type descriptor compatibility
mongooseMock.Schema.Types = {
  ObjectId: String
};

export default mongooseMock;
export const Schema = mongooseMock.Schema;
