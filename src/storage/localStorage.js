class LocalStorageModule {
  constructor() {
    this.dbName = 'huashuo_app';
    this.dbVersion = 1;
    this.db = null;
    this.initialized = false;
    this.isBrowser = typeof window !== 'undefined' && window.indexedDB;
    this.memoryStorage = new Map(); // 内存存储作为最后降级方案
  }

  async initDatabase() {
    if (!this.isBrowser) {
      console.log('非浏览器环境，使用内存存储');
      this.initialized = true;
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建存储对象
        if (!db.objectStoreNames.contains('identities')) {
          db.createObjectStore('identities', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('posts')) {
          db.createObjectStore('posts', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('数据库初始化失败:', event.target.error);
        this.initialized = true; // 即使失败也标记为初始化完成，使用降级方案
        resolve(null);
      };
    });
  }

  async getDatabase() {
    if (!this.initialized) {
      await this.initDatabase();
    }
    return this.db;
  }

  async saveData(storeName, data) {
    try {
      const db = await this.getDatabase();
      
      if (db) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(data);

          request.onsuccess = () => {
            resolve(data);
          };

          request.onerror = (event) => {
            console.error(`保存数据失败 (${storeName}):`, event.target.error);
            // 降级到LocalStorage
            this.saveToLocalStorage(storeName, data);
            resolve(data); // 降级成功后返回数据
          };
        });
      } else {
        // 降级到LocalStorage
        if (this.isBrowser) {
          this.saveToLocalStorage(storeName, data);
          return data;
        } else {
          // 非浏览器环境，使用内存存储
          const key = `${storeName}_${data.id}`;
          this.memoryStorage.set(key, data);
          return data;
        }
      }
    } catch (error) {
      console.error(`保存数据失败 (${storeName}):`, error);
      // 降级到LocalStorage
      if (this.isBrowser) {
        this.saveToLocalStorage(storeName, data);
        return data;
      } else {
        // 非浏览器环境，使用内存存储
        const key = `${storeName}_${data.id}`;
        this.memoryStorage.set(key, data);
        return data;
      }
    }
  }

  async getData(storeName, id) {
    try {
      const db = await this.getDatabase();
      
      if (db) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(id);

          request.onsuccess = () => {
            if (request.result) {
              resolve(request.result);
            } else {
              // 尝试从LocalStorage获取
              if (this.isBrowser) {
                const data = this.getFromLocalStorage(storeName, id);
                resolve(data);
              } else {
                // 非浏览器环境，从内存存储获取
                const key = `${storeName}_${id}`;
                const data = this.memoryStorage.get(key);
                resolve(data);
              }
            }
          };

          request.onerror = (event) => {
            console.error(`读取数据失败 (${storeName}):`, event.target.error);
            // 降级到LocalStorage
            if (this.isBrowser) {
              const data = this.getFromLocalStorage(storeName, id);
              resolve(data);
            } else {
              // 非浏览器环境，从内存存储获取
              const key = `${storeName}_${id}`;
              const data = this.memoryStorage.get(key);
              resolve(data);
            }
          };
        });
      } else {
        // 降级到LocalStorage
        if (this.isBrowser) {
          const data = this.getFromLocalStorage(storeName, id);
          return data;
        } else {
          // 非浏览器环境，从内存存储获取
          const key = `${storeName}_${id}`;
          const data = this.memoryStorage.get(key);
          return data;
        }
      }
    } catch (error) {
      console.error(`读取数据失败 (${storeName}):`, error);
      // 降级到LocalStorage
      if (this.isBrowser) {
        const data = this.getFromLocalStorage(storeName, id);
        return data;
      } else {
        // 非浏览器环境，从内存存储获取
        const key = `${storeName}_${id}`;
        const data = this.memoryStorage.get(key);
        return data;
      }
    }
  }

  async getAllData(storeName, query = null) {
    try {
      const db = await this.getDatabase();
      
      if (db) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = query ? store.openCursor(query) : store.getAll();

          const results = [];
          if (query) {
            request.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor) {
                results.push(cursor.value);
                cursor.continue();
              } else {
                resolve(results);
              }
            };
          } else {
            request.onsuccess = () => {
              resolve(request.result);
            };
          }

          request.onerror = (event) => {
            console.error(`读取所有数据失败 (${storeName}):`, event.target.error);
            // 降级到LocalStorage
            if (this.isBrowser) {
              const data = this.getAllFromLocalStorage(storeName);
              resolve(data);
            } else {
              // 非浏览器环境，从内存存储获取
              const data = this.getAllFromMemoryStorage(storeName);
              resolve(data);
            }
          };
        });
      } else {
        // 降级到LocalStorage
        if (this.isBrowser) {
          const data = this.getAllFromLocalStorage(storeName);
          return data;
        } else {
          // 非浏览器环境，从内存存储获取
          const data = this.getAllFromMemoryStorage(storeName);
          return data;
        }
      }
    } catch (error) {
      console.error(`读取所有数据失败 (${storeName}):`, error);
      // 降级到LocalStorage
      if (this.isBrowser) {
        const data = this.getAllFromLocalStorage(storeName);
        return data;
      } else {
        // 非浏览器环境，从内存存储获取
        const data = this.getAllFromMemoryStorage(storeName);
        return data;
      }
    }
  }

  async updateData(storeName, id, updates) {
    try {
      const existingData = await this.getData(storeName, id);
      if (!existingData) {
        throw new Error('数据不存在');
      }

      const updatedData = { ...existingData, ...updates };
      return await this.saveData(storeName, updatedData);
    } catch (error) {
      console.error(`更新数据失败 (${storeName}):`, error);
      throw error;
    }
  }

  async deleteData(storeName, id) {
    try {
      const db = await this.getDatabase();
      
      if (db) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(id);

          request.onsuccess = () => {
            // 同时从LocalStorage删除
            if (this.isBrowser) {
              this.deleteFromLocalStorage(storeName, id);
            } else {
              // 非浏览器环境，从内存存储删除
              const key = `${storeName}_${id}`;
              this.memoryStorage.delete(key);
            }
            resolve(true);
          };

          request.onerror = (event) => {
            console.error(`删除数据失败 (${storeName}):`, event.target.error);
            // 尝试从LocalStorage删除
            if (this.isBrowser) {
              this.deleteFromLocalStorage(storeName, id);
            } else {
              // 非浏览器环境，从内存存储删除
              const key = `${storeName}_${id}`;
              this.memoryStorage.delete(key);
            }
            resolve(true); // 降级成功后返回成功
          };
        });
      } else {
        // 降级到LocalStorage
        if (this.isBrowser) {
          this.deleteFromLocalStorage(storeName, id);
          return true;
        } else {
          // 非浏览器环境，从内存存储删除
          const key = `${storeName}_${id}`;
          this.memoryStorage.delete(key);
          return true;
        }
      }
    } catch (error) {
      console.error(`删除数据失败 (${storeName}):`, error);
      // 尝试从LocalStorage删除
      if (this.isBrowser) {
        this.deleteFromLocalStorage(storeName, id);
      } else {
        // 非浏览器环境，从内存存储删除
        const key = `${storeName}_${id}`;
        this.memoryStorage.delete(key);
      }
      return true;
    }
  }

  async clearData(storeName) {
    try {
      const db = await this.getDatabase();
      
      if (db) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => {
            // 同时清空LocalStorage中的对应数据
            if (this.isBrowser) {
              this.clearLocalStorage(storeName);
            } else {
              // 非浏览器环境，清空内存存储
              this.clearMemoryStorage(storeName);
            }
            resolve(true);
          };

          request.onerror = (event) => {
            console.error(`清空数据失败 (${storeName}):`, event.target.error);
            // 尝试清空LocalStorage
            if (this.isBrowser) {
              this.clearLocalStorage(storeName);
            } else {
              // 非浏览器环境，清空内存存储
              this.clearMemoryStorage(storeName);
            }
            resolve(true); // 降级成功后返回成功
          };
        });
      } else {
        // 降级到LocalStorage
        if (this.isBrowser) {
          this.clearLocalStorage(storeName);
          return true;
        } else {
          // 非浏览器环境，清空内存存储
          this.clearMemoryStorage(storeName);
          return true;
        }
      }
    } catch (error) {
      console.error(`清空数据失败 (${storeName}):`, error);
      // 尝试清空LocalStorage
      if (this.isBrowser) {
        this.clearLocalStorage(storeName);
      } else {
        // 非浏览器环境，清空内存存储
        this.clearMemoryStorage(storeName);
      }
      return true;
    }
  }

  // LocalStorage 降级方案
  saveToLocalStorage(storeName, data) {
    try {
      const key = `${storeName}_${data.id}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('LocalStorage存储失败:', error);
    }
  }

  getFromLocalStorage(storeName, id) {
    try {
      const key = `${storeName}_${id}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('LocalStorage读取失败:', error);
      return null;
    }
  }

  getAllFromLocalStorage(storeName) {
    try {
      const results = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${storeName}_`)) {
          const data = localStorage.getItem(key);
          if (data) {
            results.push(JSON.parse(data));
          }
        }
      }
      return results;
    } catch (error) {
      console.error('LocalStorage读取所有数据失败:', error);
      return [];
    }
  }

  deleteFromLocalStorage(storeName, id) {
    try {
      const key = `${storeName}_${id}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage删除失败:', error);
    }
  }

  clearLocalStorage(storeName) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${storeName}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('LocalStorage清空失败:', error);
    }
  }

  // 内存存储辅助方法
  getAllFromMemoryStorage(storeName) {
    try {
      const results = [];
      for (const [key, value] of this.memoryStorage.entries()) {
        if (key.startsWith(`${storeName}_`)) {
          results.push(value);
        }
      }
      return results;
    } catch (error) {
      console.error('内存存储读取所有数据失败:', error);
      return [];
    }
  }

  clearMemoryStorage(storeName) {
    try {
      const keysToRemove = [];
      for (const key of this.memoryStorage.keys()) {
        if (key.startsWith(`${storeName}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => this.memoryStorage.delete(key));
    } catch (error) {
      console.error('内存存储清空失败:', error);
    }
  }
}

// 导出单例实例
const localStorageModule = new LocalStorageModule();
module.exports = localStorageModule;