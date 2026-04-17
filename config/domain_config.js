// 域名配置模块

/**
 * 域名配置管理
 */
class DomainConfig {
  constructor() {
    this.config = {
      domain: 'huashuo.app',
      subdomains: {
        www: 'huashuo.app',
        api: 'api.huashuo.app',
        static: 'static.huashuo.app'
      },
      dns: {
        records: [
          {
            type: 'A',
            name: '@',
            value: '192.168.1.1', // 示例IP，实际应替换为部署服务的IP
            ttl: 300
          },
          {
            type: 'CNAME',
            name: 'www',
            value: 'huashuo.app',
            ttl: 300
          },
          {
            type: 'A',
            name: 'api',
            value: '192.168.1.2', // 示例IP，实际应替换为后端服务的IP
            ttl: 300
          },
          {
            type: 'CNAME',
            name: 'static',
            value: 'huashuo.app',
            ttl: 300
          }
        ]
      },
      https: {
        provider: 'letsencrypt', // letsencrypt, cloudflare, custom
        autoRenew: true,
        expirationDays: 90
      },
      deployment: {
        frontend: 'vercel', // vercel, netlify, github-pages
        backend: 'heroku' // heroku, aws, digitalocean
      }
    };
  }

  /**
   * 获取完整域名配置
   * @returns {Object} 域名配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 获取主域名
   * @returns {string} 主域名
   */
  getDomain() {
    return this.config.domain;
  }

  /**
   * 获取子域名配置
   * @param {string} subdomain 子域名名称
   * @returns {string|null} 子域名完整地址
   */
  getSubdomain(subdomain) {
    return this.config.subdomains[subdomain] || null;
  }

  /**
   * 获取所有子域名
   * @returns {Object} 子域名配置
   */
  getSubdomains() {
    return this.config.subdomains;
  }

  /**
   * 获取DNS记录配置
   * @returns {Array} DNS记录列表
   */
  getDnsRecords() {
    return this.config.dns.records;
  }

  /**
   * 获取HTTPS配置
   * @returns {Object} HTTPS配置
   */
  getHttpsConfig() {
    return this.config.https;
  }

  /**
   * 获取部署配置
   * @returns {Object} 部署配置
   */
  getDeploymentConfig() {
    return this.config.deployment;
  }

  /**
   * 验证域名配置
   * @returns {Object} 验证结果
   */
  validateConfig() {
    const errors = [];

    // 验证主域名
    if (!this.config.domain || typeof this.config.domain !== 'string') {
      errors.push('主域名配置错误');
    }

    // 验证子域名
    if (!this.config.subdomains || typeof this.config.subdomains !== 'object') {
      errors.push('子域名配置错误');
    }

    // 验证DNS记录
    if (!this.config.dns || !Array.isArray(this.config.dns.records)) {
      errors.push('DNS记录配置错误');
    } else {
      this.config.dns.records.forEach((record, index) => {
        if (!record.type || !record.name || !record.value) {
          errors.push(`DNS记录 ${index + 1} 配置不完整`);
        }
      });
    }

    // 验证HTTPS配置
    if (!this.config.https || !this.config.https.provider) {
      errors.push('HTTPS配置错误');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成部署服务域名绑定配置
   * @param {string} service 服务类型 (frontend, backend)
   * @returns {Object} 绑定配置
   */
  generateServiceConfig(service) {
    if (service === 'frontend') {
      return {
        domain: this.config.domain,
        subdomains: ['www', 'static'],
        https: this.config.https,
        provider: this.config.deployment.frontend
      };
    } else if (service === 'backend') {
      return {
        domain: this.config.subdomains.api,
        https: this.config.https,
        provider: this.config.deployment.backend
      };
    }
    return null;
  }

  /**
   * 生成DNS配置说明
   * @returns {string} DNS配置说明
   */
  generateDnsInstructions() {
    let instructions = 'DNS配置说明:\n\n';
    
    this.config.dns.records.forEach(record => {
      instructions += `记录类型: ${record.type}\n`;
      instructions += `主机记录: ${record.name}\n`;
      instructions += `记录值: ${record.value}\n`;
      instructions += `TTL: ${record.ttl}秒\n\n`;
    });
    
    return instructions;
  }

  /**
   * 生成HTTPS配置说明
   * @returns {string} HTTPS配置说明
   */
  generateHttpsInstructions() {
    let instructions = 'HTTPS配置说明:\n\n';
    
    if (this.config.https.provider === 'letsencrypt') {
      instructions += '1. 安装Certbot:\n';
      instructions += '   sudo apt install certbot\n\n';
      instructions += '2. 获取证书:\n';
      instructions += `   sudo certbot certonly --standalone -d ${this.config.domain} -d www.${this.config.domain}\n\n`;
      instructions += '3. 配置自动续期:\n';
      instructions += '   sudo crontab -e\n';
      instructions += '   添加: 0 0 * * 0 certbot renew\n';
    } else if (this.config.https.provider === 'cloudflare') {
      instructions += '1. 登录Cloudflare控制台\n';
      instructions += '2. 选择您的域名\n';
      instructions += '3. 进入SSL/TLS设置\n';
      instructions += '4. 选择"完全"模式\n';
      instructions += '5. 启用自动HTTPS重定向\n';
    } else {
      instructions += '请按照您选择的SSL提供商的说明配置HTTPS\n';
    }
    
    return instructions;
  }

  /**
   * 生成部署服务配置说明
   * @param {string} service 服务类型 (frontend, backend)
   * @returns {string} 部署服务配置说明
   */
  generateDeploymentInstructions(service) {
    let instructions = '';
    
    if (service === 'frontend') {
      instructions = '前端部署服务配置说明:\n\n';
      
      if (this.config.deployment.frontend === 'vercel') {
        instructions += '1. 登录Vercel控制台\n';
        instructions += '2. 选择您的项目\n';
        instructions += '3. 进入Settings > Domains\n';
        instructions += `4. 添加域名: ${this.config.domain}\n`;
        instructions += '5. 按照提示配置DNS记录\n';
        instructions += '6. 等待域名验证完成\n';
        instructions += '7. HTTPS会自动配置\n';
      } else if (this.config.deployment.frontend === 'netlify') {
        instructions += '1. 登录Netlify控制台\n';
        instructions += '2. 选择您的站点\n';
        instructions += '3. 进入Domain settings\n';
        instructions += `4. 添加域名: ${this.config.domain}\n`;
        instructions += '5. 按照提示配置DNS记录\n';
        instructions += '6. 等待域名验证完成\n';
        instructions += '7. HTTPS会自动配置\n';
      } else if (this.config.deployment.frontend === 'github-pages') {
        instructions += '1. 登录GitHub\n';
        instructions += '2. 进入仓库设置\n';
        instructions += '3. 进入Pages设置\n';
        instructions += `4. 配置自定义域名: ${this.config.domain}\n`;
        instructions += '5. 按照提示配置DNS记录\n';
        instructions += '6. 启用HTTPS\n';
      }
    } else if (service === 'backend') {
      instructions = '后端部署服务配置说明:\n\n';
      
      if (this.config.deployment.backend === 'heroku') {
        instructions += '1. 登录Heroku控制台\n';
        instructions += '2. 选择您的应用\n';
        instructions += '3. 进入Settings > Domains\n';
        instructions += `4. 添加域名: ${this.config.subdomains.api}\n`;
        instructions += '5. 按照提示配置DNS记录\n';
        instructions += '6. 启用SSL\n';
      } else if (this.config.deployment.backend === 'aws') {
        instructions += '1. 登录AWS控制台\n';
        instructions += '2. 进入EC2或ELB设置\n';
        instructions += '3. 配置负载均衡器\n';
        instructions += `4. 添加域名: ${this.config.subdomains.api}\n`;
        instructions += '5. 配置DNS记录\n';
        instructions += '6. 配置HTTPS证书\n';
      } else if (this.config.deployment.backend === 'digitalocean') {
        instructions += '1. 登录DigitalOcean控制台\n';
        instructions += '2. 选择您的Droplet\n';
        instructions += '3. 进入Networking设置\n';
        instructions += `4. 添加域名: ${this.config.subdomains.api}\n`;
        instructions += '5. 配置DNS记录\n';
        instructions += '6. 配置HTTPS证书\n';
      }
    }
    
    return instructions;
  }
}

// 导出域名配置实例
const domainConfig = new DomainConfig();
export default domainConfig;