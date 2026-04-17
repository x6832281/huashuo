/**
 * ============================================
 * 本地存储模块 (localStorage.js)
 * ============================================
 * 
 * 功能说明：
 * 本模块实现了客户端数据的多级存储策略，用于保存身份、帖子、卡片等用户数据。
 * 
 * 存储层级（优先级从高到低）：
 * 1. IndexedDB - 主存储方案，支持大容量数据存储（通常50MB+）
 * 2. LocalStorage - 降级方案，当IndexedDB不可用时使用（限制约5MB）
 * 3. 内存存储(Map) - 最终降级方案，用于服务端测试或极端情况
 * 
 * 降级机制：
 * 当主存储方案（IndexedDB）出现故障时，系统会自动降级到下一层级，
 * 确保数据读写操作始终能够成功，不会因为存储问题导致应用崩溃。
 * 
 * 数据存储结构：
 * - identities: 用户身份信息（昵称、头像、创建时间等）
 * - posts: 用户发布的心事帖子（内容、情绪频段、时间戳等）
 * - cards: 生成的卡片数据（卡片内容、样式、二维码等）
 * 
 * 业务规则：
 * - 所有操作都包含完整的错误处理和日志记录
 * - 读写操作都会尝试从所有可用存储层获取数据
 * - 删除操作会同步清理所有存储层的数据
 * - 支持批量操作和查询过滤
 * 
 * 作者：话说APP开发团队
 * 创建日期：2024年
 * 最后更新：2026年4月
 */

/**
 * 本地存储模块类
 * 实现了IndexedDB、LocalStorage和内存存储的三级存储策略
 */
class LocalStorageModule {
  /**
   * 构造函数：初始化存储模块的配置参数
   * 设置数据库名称、版本号以及存储降级相关的属性
   */
  constructor() {
    // IndexedDB数据库名称，用于浏览器中唯一标识此数据库
    this.dbName = 'huashuo_app';
    
    // 数据库版本号，用于后续数据库结构升级时触发onupgradeneeded事件
    this.dbVersion = 1;
    
    // 数据库连接实例，初始化数据库后会被赋值
    this.db = null;
    
    // 初始化状态标记，防止重复初始化数据库
    this.initialized = false;
    
    // 浏览器环境检测：检查是否在浏览器中运行且支持IndexedDB
    // 这个检测很重要，因为Node.js环境不支持IndexedDB
    this.isBrowser = typeof window !== 'undefined' && window.indexedDB;
    
    // 内存存储作为最后降级方案
    // 使用JavaScript Map对象存储数据，键值对格式
    // 适用于服务端测试、无浏览器环境或所有存储都失败的极端情况
    this.memoryStorage = new Map();
  }

  /**
   * 初始化IndexedDB数据库
   * 创建数据库连接并设置对象存储（表结构）
   * 
   * 工作原理：
   * 1. 检测当前运行环境，如果是非浏览器环境则直接返回
   * 2. 使用window.indexedDB.open()打开或创建数据库
   * 3. 在onupgradeneeded事件中创建三个对象存储：identities、posts、cards
   * 4. 数据库创建成功后，将db实例保存到this.db中
   * 
   * 对象存储（类似于关系数据库中的表）：
   * - identities: 存储用户身份信息，主键为id
   * - posts: 存储心事帖子信息，主键为id
   * - cards: 存储生成的卡片信息，主键为id
   * 
   * @returns {Promise<IDBDatabase|null>} 返回数据库连接实例，如果初始化失败返回null
   */
  async initDatabase() {
    // 环境检测：如果在Node.js等非浏览器环境中运行，不使用IndexedDB
    // 因为IndexedDB是浏览器特有的API，服务端环境不可用
    if (!this.isBrowser) {
      console.log('非浏览器环境，使用内存存储');
      this.initialized = true;
      return null;
    }

    // 使用Promise包装IndexedDB的异步操作，使其可以用async/await语法调用
    // IndexedDB原生使用事件回调（onsuccess、onerror等），Promise化后更易用
    return new Promise((resolve, reject) => {
      // 打开数据库，如果不存在则创建
      // 第一个参数是数据库名称，第二个是版本号
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      // 数据库升级事件：当版本号高于当前版本时触发
      // 在这里创建初始的对象存储（类似于创建数据库表）
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建身份信息的存储对象
        // keyPath: 'id' 表示使用数据对象的id字段作为主键
        // 这样可以确保每条身份记录都有唯一标识
        if (!db.objectStoreNames.contains('identities')) {
          db.createObjectStore('identities', { keyPath: 'id' });
        }
        
        // 创建心事帖子的存储对象
        // 同样使用id作为主键
        if (!db.objectStoreNames.contains('posts')) {
          db.createObjectStore('posts', { keyPath: 'id' });
        }
        
        // 创建卡片的存储对象
        // 同样使用id作为主键
        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' });
        }
      };

      // 数据库打开成功事件
      // 保存数据库连接实例，标记初始化完成
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        resolve(this.db);
      };

      // 数据库打开失败事件
      // 即使失败也标记为初始化完成，因为系统会降级到LocalStorage或内存存储
      // 这样可以确保即使IndexedDB不可用，应用仍能正常运行
      request.onerror = (event) => {
        console.error('数据库初始化失败:', event.target.error);
        this.initialized = true; // 即使失败也标记为初始化完成，使用降级方案
        resolve(null);
      };
    });
  }

  /**
   * 获取数据库连接实例
   * 如果数据库尚未初始化，则先调用initDatabase()进行初始化
   * 这是一个懒加载模式的方法，只有在第一次需要数据库时才会初始化
   * 
   * @returns {Promise<IDBDatabase|null>} 返回数据库连接实例或null
   */
  async getDatabase() {
    // 检查是否已经初始化
    // 如果没有，先调用initDatabase()进行初始化
    if (!this.initialized) {
      await this.initDatabase();
    }
    // 返回数据库实例（可能为null，表示使用降级方案）
    return this.db;
  }

  /**
   * 保存数据到存储系统
   * 这是核心的数据写入方法，实现了三级存储的完整降级逻辑
   * 
   * 工作流程：
   * 1. 尝试使用IndexedDB保存数据（主存储方案）
   * 2. 如果IndexedDB不可用或失败，降级到LocalStorage
   * 3. 如果LocalStorage也不可用（非浏览器环境），使用内存存储
   * 
   * 降级策略保证：无论运行环境如何，数据保存操作都会成功
   * 
   * @param {string} storeName - 存储对象名称（'identities'、'posts'或'cards'）
   * @param {Object} data - 要保存的数据对象，必须包含id字段
   * @returns {Promise<Object>} 返回保存的数据对象
   */
  async saveData(storeName, data) {
    try {
      // 获取数据库连接，如果未初始化会自动初始化
      const db = await this.getDatabase();
      
      // 如果数据库连接可用，使用IndexedDB保存数据
      if (db) {
        return new Promise((resolve, reject) => {
          // 创建读写事务
          // IndexedDB的所有操作都必须在事务中执行
          // 'readwrite' 表示这是一个读写事务，可以修改数据
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(data);

          // 数据保存成功
          request.onsuccess = () => {
            resolve(data);
          };

          // 数据保存失败，降级到LocalStorage
          // 注意：即使IndexedDB失败，我们仍然尝试LocalStorage，
          // 这样可以确保数据不会丢失
          request.onerror = (event) => {
            console.error(`保存数据失败 (${storeName}):`, event.target.error);
            // 降级到LocalStorage
            this.saveToLocalStorage(storeName, data);
            resolve(data); // 降级成功后返回数据
          };
        });
      } else {
        // 数据库不可用，直接降级到LocalStorage或内存存储
        if (this.isBrowser) {
          // 浏览器环境：使用LocalStorage
          this.saveToLocalStorage(storeName, data);
          return data;
        } else {
          // 非浏览器环境（如Node.js测试环境）：使用内存存储
          // 内存存储使用Map对象，键格式为 "storeName_id"
          const key = `${storeName}_${data.id}`;
          this.memoryStorage.set(key, data);
          return data;
        }
      }
    } catch (error) {
      // 捕获所有异常，执行降级逻辑
      // 这样可以确保即使代码出现bug，也不会导致应用崩溃
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

  /**
   * 从存储系统读取单条数据
   * 实现了从IndexedDB到LocalStorage再到内存存储的完整降级读取逻辑
   * 
   * 读取策略：
   * 1. 优先从IndexedDB读取
   * 2. 如果IndexedDB中没有找到，尝试从LocalStorage读取
   * 3. 如果都失败，从内存存储读取
   * 
   * 这种多级读取策略确保了数据的高可用性，
   * 即使主存储出现问题，也能从降级存储中恢复数据
   * 
   * @param {string} storeName - 存储对象名称（'identities'、'posts'或'cards'）
   * @param {string|number} id - 数据的主键ID
   * @returns {Promise<Object|null>} 返回读取到的数据对象，如果不存在返回null
   */
  async getData(storeName, id) {
    try {
      // 获取数据库连接
      const db = await this.getDatabase();
      
      // 如果数据库可用，从IndexedDB读取
      if (db) {
        return new Promise((resolve, reject) => {
          // 创建只读事务
          // 'readonly' 表示这是一个只读事务，只能读取数据不能修改
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(id);

          // 读取成功
          request.onsuccess = () => {
            if (request.result) {
              // 在IndexedDB中找到数据，直接返回
              resolve(request.result);
            } else {
              // IndexedDB中没有找到，尝试从LocalStorage读取
              // 这可能是因为之前降级保存的数据
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

          // IndexedDB读取失败，降级到LocalStorage
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
        // 数据库不可用，直接从LocalStorage或内存存储读取
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
      // 捕获所有异常，执行降级读取逻辑
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

  /**
   * 从存储系统读取所有数据（支持可选的查询过滤）
   * 可以获取指定存储对象中的全部数据，或使用游标查询进行过滤
   * 
   * 使用场景：
   * - 获取所有身份信息（用于身份选择器）
   * - 获取所有帖子（用于帖子列表展示）
   * - 获取所有卡片（用于卡片管理）
   * - 使用query参数进行条件查询（如只获取某个身份的帖子）
   * 
   * @param {string} storeName - 存储对象名称（'identities'、'posts'或'cards'）
   * @param {IDBKeyRange|null} query - 可选的查询条件，使用IndexedDB的键范围
   *   例如：IDBKeyRange.only('some_id') 只查询特定ID的数据
   * @returns {Promise<Array>} 返回数据对象数组
   */
  async getAllData(storeName, query = null) {
    try {
      // 获取数据库连接
      const db = await this.getDatabase();
      
      // 如果数据库可用，从IndexedDB读取所有数据
      if (db) {
        return new Promise((resolve, reject) => {
          // 创建只读事务
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          
          // 根据是否有查询条件，选择不同的读取方式
          // query存在时使用游标查询（openCursor），可以逐条遍历数据
          // query为null时使用getAll()一次性获取所有数据，性能更好
          const request = query ? store.openCursor(query) : store.getAll();

          const results = [];
          if (query) {
            // 使用游标遍历查询结果
            // 游标模式适用于大数据集，可以逐条处理，避免一次性加载所有数据到内存
            request.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor) {
                // 还有数据，添加到结果集并继续遍历
                results.push(cursor.value);
                cursor.continue(); // 移动到下一条记录
              } else {
                // 所有数据处理完成，返回结果
                resolve(results);
              }
            };
          } else {
            // 使用getAll()一次性获取所有数据
            // 适用于数据量较小的情况，性能比游标更好
            request.onsuccess = () => {
              resolve(request.result);
            };
          }

          // IndexedDB读取失败，降级到LocalStorage
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
        // 数据库不可用，直接从LocalStorage或内存存储读取
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
      // 捕获所有异常，执行降级读取逻辑
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

  /**
   * 更新存储系统中的数据
   * 先读取现有数据，然后合并更新字段，最后保存
   * 
   * 更新策略：
   * 1. 先使用getData()读取现有数据（确保从可用的存储层读取）
   * 2. 使用对象展开运算符合并现有数据和新数据
   * 3. 使用saveData()保存更新后的数据（确保写入到可用的存储层）
   * 
   * 这种策略确保了更新操作能够正确地处理多级存储，
   * 即使数据分布在不同的存储层也能正确更新
   * 
   * @param {string} storeName - 存储对象名称（'identities'、'posts'或'cards'）
   * @param {string|number} id - 要更新的数据的主键ID
   * @param {Object} updates - 要更新的字段对象，只包含需要修改的字段
   * @returns {Promise<Object>} 返回更新后的完整数据对象
   * @throws {Error} 如果数据不存在则抛出"数据不存在"错误
   */
  async updateData(storeName, id, updates) {
    try {
      // 先读取现有数据
      // 使用getData确保从可用的存储层读取
      const existingData = await this.getData(storeName, id);
      
      // 检查数据是否存在
      if (!existingData) {
        throw new Error('数据不存在');
      }

      // 合并现有数据和新数据
      // 使用对象展开运算符(...)，新数据会覆盖现有数据的同名字段
      // 但不会删除现有数据中未被更新的字段
      const updatedData = { ...existingData, ...updates };
      
      // 保存更新后的数据
      // 使用saveData确保写入到可用的存储层
      return await this.saveData(storeName, updatedData);
    } catch (error) {
      // 记录错误日志并重新抛出异常
      // 调用者需要处理这个异常（如显示错误提示给用户）
      console.error(`更新数据失败 (${storeName}):`, error);
      throw error;
    }
  }

  /**
   * 从存储系统中删除数据
   * 实现了从IndexedDB到LocalStorage/内存存储的完整降级删除逻辑
   * 
   * 删除策略：
   * 1. 优先从IndexedDB删除
   * 2. 删除成功后，同时从LocalStorage或内存存储中删除（清理所有层级）
   * 3. 如果IndexedDB删除失败，尝试从LocalStorage或内存存储删除
   * 
   * 清理所有层级的原因是：
   * - 防止数据在不同存储层之间出现不一致
   * - 确保删除操作彻底完成，不会留下残余数据
   * - 释放存储空间，避免存储浪费
   * 
   * @param {string} storeName - 存储对象名称（'identities'、'posts'或'cards'）
   * @param {string|number} id - 要删除的数据的主键ID
   * @returns {Promise<boolean>} 删除成功返回true，失败也会尝试降级删除
   */
  async deleteData(storeName, id) {
    try {
      // 获取数据库连接
      const db = await this.getDatabase();
      
      // 如果数据库可用，从IndexedDB删除
      if (db) {
        return new Promise((resolve, reject) => {
          // 创建读写事务
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(id);

          // IndexedDB删除成功
          request.onsuccess = () => {
            // 同时从LocalStorage删除（如果是在浏览器环境）
            // 确保所有存储层的数据都被清理
            if (this.isBrowser) {
              this.deleteFromLocalStorage(storeName, id);
            } else {
              // 非浏览器环境，从内存存储删除
              const key = `${storeName}_${id}`;
              this.memoryStorage.delete(key);
            }
            resolve(true);
          };

          // IndexedDB删除失败，降级到LocalStorage
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
        // 数据库不可用，直接从LocalStorage或内存存储删除
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
      // 捕获所有异常，执行降级删除逻辑
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

  /**
   * 清空指定存储对象中的所有数据
   * 实现了从IndexedDB到LocalStorage/内存存储的完整降级清空逻辑
   * 
   * 清空策略：
   * 1. 优先清空IndexedDB中的数据
   * 2. 清空成功后，同时清空LocalStorage或内存存储中的对应数据
   * 3. 如果IndexedDB清空失败，尝试清空LocalStorage或内存存储
   * 
   * 注意：此操作只清空指定存储对象（storeName）中的数据，
   * 不会影响其他存储对象的数据。例如清空'posts'不会影响'identities'。
   * 
   * 使用场景：
   * - 用户选择清除所有帖子数据
   * - 应用重置功能
   * - 数据迁移前的清理
   * 
   * @param {string} storeName - 要清空的存储对象名称（'identities'、'posts'或'cards'）
   * @returns {Promise<boolean>} 清空成功返回true，失败也会尝试降级清空
   */
  async clearData(storeName) {
    try {
      // 获取数据库连接
      const db = await this.getDatabase();
      
      // 如果数据库可用，清空IndexedDB中的数据
      if (db) {
        return new Promise((resolve, reject) => {
          // 创建读写事务
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear(); // clear()方法清空对象存储中的所有数据

          // IndexedDB清空成功
          request.onsuccess = () => {
            // 同时清空LocalStorage中的对应数据
            // 确保所有存储层的数据都被清理
            if (this.isBrowser) {
              this.clearLocalStorage(storeName);
            } else {
              // 非浏览器环境，清空内存存储
              this.clearMemoryStorage(storeName);
            }
            resolve(true);
          };

          // IndexedDB清空失败，降级到LocalStorage
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
        // 数据库不可用，直接清空LocalStorage或内存存储
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
      // 捕获所有异常，执行降级清空逻辑
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

  // ==========================================
  // LocalStorage 降级方案相关方法
  // ==========================================
  // 这些方法用于在IndexedDB不可用时提供数据存储
  // LocalStorage是浏览器提供的简单键值存储API
  // 限制：通常只能存储约5MB的数据

  /**
   * 将数据保存到LocalStorage（降级方案）
   * 
   * 键名格式：storeName_id
   * 例如：'posts_123456' 表示id为123456的帖子数据
   * 
   * 值格式：JSON字符串
   * 因为LocalStorage只能存储字符串，所以需要将对象序列化为JSON
   * 
   * @param {string} storeName - 存储对象名称
   * @param {Object} data - 要保存的数据对象
   */
  saveToLocalStorage(storeName, data) {
    try {
      // 构造键名：存储对象名称_数据ID
      const key = `${storeName}_${data.id}`;
      // 将对象序列化为JSON字符串后存储
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // 记录错误日志，但不抛出异常
      // 因为这是降级方案，失败不应该影响主流程
      console.error('LocalStorage存储失败:', error);
    }
  }

  /**
   * 从LocalStorage读取单条数据（降级方案）
   * 
   * @param {string} storeName - 存储对象名称
   * @param {string|number} id - 数据的主键ID
   * @returns {Object|null} 返回读取到的数据对象，如果不存在或读取失败返回null
   */
  getFromLocalStorage(storeName, id) {
    try {
      // 构造键名
      const key = `${storeName}_${id}`;
      // 从LocalStorage读取JSON字符串
      const data = localStorage.getItem(key);
      // 如果数据存在，反序列化为对象；否则返回null
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // 记录错误日志，返回null表示数据不存在或读取失败
      console.error('LocalStorage读取失败:', error);
      return null;
    }
  }

  /**
   * 从LocalStorage读取所有数据（降级方案）
   * 遍历LocalStorage中所有键，筛选出属于指定存储对象的数据
   * 
   * 注意：这个方法会遍历整个LocalStorage，
   * 如果LocalStorage中有很多其他应用的数据，可能会影响性能
   * 
   * @param {string} storeName - 存储对象名称
   * @returns {Array} 返回数据对象数组
   */
  getAllFromLocalStorage(storeName) {
    try {
      const results = [];
      // 遍历LocalStorage中的所有键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 检查键名是否以指定存储对象名称开头
        // 例如：'posts_123' 以 'posts_' 开头，属于posts存储
        if (key.startsWith(`${storeName}_`)) {
          const data = localStorage.getItem(key);
          if (data) {
            // 反序列化为对象并添加到结果集
            results.push(JSON.parse(data));
          }
        }
      }
      return results;
    } catch (error) {
      // 记录错误日志，返回空数组
      console.error('LocalStorage读取所有数据失败:', error);
      return [];
    }
  }

  /**
   * 从LocalStorage删除单条数据（降级方案）
   * 
   * @param {string} storeName - 存储对象名称
   * @param {string|number} id - 要删除的数据的主键ID
   */
  deleteFromLocalStorage(storeName, id) {
    try {
      // 构造键名并删除
      const key = `${storeName}_${id}`;
      localStorage.removeItem(key);
    } catch (error) {
      // 记录错误日志，但不抛出异常
      console.error('LocalStorage删除失败:', error);
    }
  }

  /**
   * 清空LocalStorage中指定存储对象的所有数据（降级方案）
   * 
   * 实现方式：
   * 1. 先遍历LocalStorage，收集所有匹配的键名
   * 2. 然后批量删除这些键
   * 
   * 为什么分两步？因为如果在遍历过程中直接删除，
   * 会影响localStorage.length和索引，导致遍历出错
   * 
   * @param {string} storeName - 要清空的存储对象名称
   */
  clearLocalStorage(storeName) {
    try {
      const keysToRemove = [];
      // 第一步：收集所有匹配的键名
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${storeName}_`)) {
          keysToRemove.push(key);
        }
      }
      // 第二步：批量删除收集到的键
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      // 记录错误日志，但不抛出异常
      console.error('LocalStorage清空失败:', error);
    }
  }

  // ==========================================
  // 内存存储辅助方法
  // ==========================================
  // 这些方法用于在非浏览器环境（如Node.js测试）中提供数据存储
  // 内存存储在应用重启后会丢失，只适用于临时存储或测试场景

  /**
   * 从内存存储读取所有数据（最终降级方案）
   * 遍历内存存储Map，筛选出属于指定存储对象的数据
   * 
   * @param {string} storeName - 存储对象名称
   * @returns {Array} 返回数据对象数组
   */
  getAllFromMemoryStorage(storeName) {
    try {
      const results = [];
      // 遍历Map中的所有键值对
      for (const [key, value] of this.memoryStorage.entries()) {
        // 检查键名是否以指定存储对象名称开头
        if (key.startsWith(`${storeName}_`)) {
          results.push(value);
        }
      }
      return results;
    } catch (error) {
      // 记录错误日志，返回空数组
      console.error('内存存储读取所有数据失败:', error);
      return [];
    }
  }

  /**
   * 清空内存存储中指定存储对象的所有数据（最终降级方案）
   * 
   * 实现方式：
   * 1. 先收集所有匹配的键名
   * 2. 然后批量删除
   * 
   * 为什么不能直接遍历并删除？因为Map的迭代过程中不能修改Map，
   * 会抛出"Cannot delete properties during iteration"错误
   * 
   * @param {string} storeName - 要清空的存储对象名称
   */
  clearMemoryStorage(storeName) {
    try {
      const keysToRemove = [];
      // 第一步：收集所有匹配的键名
      for (const key of this.memoryStorage.keys()) {
        if (key.startsWith(`${storeName}_`)) {
          keysToRemove.push(key);
        }
      }
      // 第二步：批量删除收集到的键
      keysToRemove.forEach(key => this.memoryStorage.delete(key));
    } catch (error) {
      // 记录错误日志，但不抛出异常
      console.error('内存存储清空失败:', error);
    }
  }
}

// ==========================================
// 模块导出
// ==========================================
// 导出单例实例，确保整个应用中只有一个存储实例
// 这样可以避免多个实例导致的存储不一致问题
// 
// 使用方式：
// import localStorageModule from './src/storage/localStorage.js';
// await localStorageModule.initDatabase();
// const data = await localStorageModule.getData('posts', '123');
// 
// 单例模式的好处：
// 1. 节省内存：不会创建多个数据库连接
// 2. 数据一致性：所有代码都操作同一个存储实例
// 3. 初始化状态共享：一次初始化，全局可用

const localStorageModule = new LocalStorageModule();
export default localStorageModule;
