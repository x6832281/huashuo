# 域名配置模块使用说明

## 1. 模块介绍

域名配置模块（Domain Configuration Module）是话说APP的网络配置核心模块，负责域名管理、DNS解析配置和HTTPS证书配置，确保应用能够通过自定义域名安全访问。

### 核心特性

- **域名管理**：注册和管理自定义域名
- **DNS配置**：配置域名解析记录
- **HTTPS证书**：配置和管理SSL证书
- **域名绑定**：将域名绑定到部署服务
- **子域名配置**：配置子域名（如api.域名.com）
- **配置验证**：验证域名配置的正确性
- **部署说明**：生成详细的部署配置说明

## 2. 安装方法

### 2.1 环境要求

- **域名注册**：已注册的域名
- **DNS服务**：Cloudflare / AWS Route 53 / 域名注册商自带DNS
- **部署服务**：Vercel / Netlify / Heroku / AWS
- **SSL证书**：Let's Encrypt / Cloudflare SSL

### 2.2 安装步骤

1. **创建配置目录**：
   ```bash
   mkdir -p config
   ```

2. **复制配置文件**：
   ```bash
   cp config/domain_config.js.example config/domain_config.js
   ```

3. **编辑配置文件**：
   ```bash
   # 编辑config/domain_config.js文件，配置域名相关信息
   ```

4. **验证配置**：
   ```bash
   node test/domain.test.js
   ```

## 3. 核心功能使用

### 3.1 配置管理

**获取完整配置**：
```javascript
const domainConfig = require('./config/domain_config');

const config = domainConfig.getConfig();
console.log('完整配置:', config);
```

**获取主域名**：
```javascript
const domain = domainConfig.getDomain();
console.log('主域名:', domain); // 输出: huashuo.app
```

**获取子域名**：
```javascript
const wwwDomain = domainConfig.getSubdomain('www');
const apiDomain = domainConfig.getSubdomain('api');
console.log('www子域名:', wwwDomain); // 输出: huashuo.app
console.log('api子域名:', apiDomain); // 输出: api.huashuo.app
```

**获取所有子域名**：
```javascript
const subdomains = domainConfig.getSubdomains();
console.log('所有子域名:', subdomains);
```

### 3.2 DNS配置

**获取DNS记录**：
```javascript
const records = domainConfig.getDnsRecords();
console.log('DNS记录:', records);
```

**生成DNS配置说明**：
```javascript
const dnsInstructions = domainConfig.generateDnsInstructions();
console.log('DNS配置说明:', dnsInstructions);
```

### 3.3 HTTPS配置

**获取HTTPS配置**：
```javascript
const httpsConfig = domainConfig.getHttpsConfig();
console.log('HTTPS配置:', httpsConfig);
```

**生成HTTPS配置说明**：
```javascript
const httpsInstructions = domainConfig.generateHttpsInstructions();
console.log('HTTPS配置说明:', httpsInstructions);
```

### 3.4 部署服务配置

**获取部署配置**：
```javascript
const deploymentConfig = domainConfig.getDeploymentConfig();
console.log('部署配置:', deploymentConfig);
```

**生成服务配置**：
```javascript
const frontendConfig = domainConfig.generateServiceConfig('frontend');
const backendConfig = domainConfig.generateServiceConfig('backend');
console.log('前端服务配置:', frontendConfig);
console.log('后端服务配置:', backendConfig);
```

**生成部署服务配置说明**：
```javascript
const frontendInstructions = domainConfig.generateDeploymentInstructions('frontend');
const backendInstructions = domainConfig.generateDeploymentInstructions('backend');
console.log('前端部署说明:', frontendInstructions);
console.log('后端部署说明:', backendInstructions);
```

### 3.5 配置验证

**验证配置**：
```javascript
const validation = domainConfig.validateConfig();
console.log('验证结果:', validation);
if (validation.valid) {
  console.log('配置验证通过');
} else {
  console.log('配置验证失败:', validation.errors);
}
```

## 4. 配置选项

### 4.1 域名配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| domain | huashuo.app | 主域名 |
| subdomains.www | huashuo.app | www子域名 |
| subdomains.api | api.huashuo.app | api子域名 |
| subdomains.static | static.huashuo.app | static子域名 |

### 4.2 DNS配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| records[0].type | A | 主域名A记录 |
| records[0].name | @ | 主机记录 |
| records[0].value | 192.168.1.1 | 部署服务IP地址 |
| records[0].ttl | 300 | 记录缓存时间（秒） |
| records[1].type | CNAME | www子域名CNAME记录 |
| records[1].name | www | 主机记录 |
| records[1].value | huashuo.app | 主域名 |
| records[1].ttl | 300 | 记录缓存时间（秒） |
| records[2].type | A | api子域名A记录 |
| records[2].name | api | 主机记录 |
| records[2].value | 192.168.1.2 | 后端服务IP地址 |
| records[2].ttl | 300 | 记录缓存时间（秒） |
| records[3].type | CNAME | static子域名CNAME记录 |
| records[3].name | static | 主机记录 |
| records[3].value | huashuo.app | 主域名 |
| records[3].ttl | 300 | 记录缓存时间（秒） |

### 4.3 HTTPS配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| provider | letsencrypt | SSL证书提供商（letsencrypt, cloudflare, custom） |
| autoRenew | true | 是否自动续期 |
| expirationDays | 90 | 证书有效期（天） |

### 4.4 部署配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| frontend | vercel | 前端部署服务（vercel, netlify, github-pages） |
| backend | heroku | 后端部署服务（heroku, aws, digitalocean） |

## 5. 业务规则

### 5.1 域名规则

- **域名选择**：选择易于记忆、符合品牌形象的域名
- **子域名规划**：合理规划子域名，如api.域名.com用于后端API
- **域名安全**：启用域名锁定和WHOIS保护，防止域名被恶意转移

### 5.2 DNS规则

- **记录类型**：根据部署服务类型选择A记录或CNAME记录
- **TTL设置**：设置合理的TTL值，建议300秒（5分钟）
- **记录配置**：确保DNS记录正确指向部署服务

### 5.3 HTTPS规则

- **强制HTTPS**：所有访问必须使用HTTPS
- **证书管理**：使用自动续期的SSL证书，避免证书过期
- **安全配置**：配置适当的SSL/TLS版本和密码套件

### 5.4 部署规则

- **域名绑定**：将域名正确绑定到部署服务
- **验证所有权**：完成域名所有权验证
- **配置更新**：DNS记录更新后等待生效（通常需要10-30分钟）

## 6. 性能优化

### 6.1 DNS优化

- **使用CDN**：使用Cloudflare等CDN服务，提高DNS解析速度
- **合理TTL**：设置适当的TTL值，平衡解析速度和更新灵活性
- **多DNS服务器**：配置多个DNS服务器，提高可靠性

### 6.2 HTTPS优化

- **HTTP/2**：启用HTTP/2，提高传输效率
- **OCSP Stapling**：启用OCSP Stapling，减少SSL握手时间
- **Session Resumption**：启用Session Resumption，加速重复访问

### 6.3 部署优化

- **全球部署**：使用全球部署服务，提高访问速度
- **负载均衡**：配置负载均衡，分散流量
- **缓存策略**：合理设置缓存策略，减少重复请求

## 7. 安全配置

### 7.1 域名安全

- **WHOIS保护**：启用WHOIS保护，隐藏域名注册信息
- **域名锁定**：启用域名锁定，防止恶意转移
- **双因素认证**：为域名注册账户启用双因素认证

### 7.2 HTTPS安全

- **强加密**：使用强加密算法和密码套件
- **证书验证**：定期检查SSL证书状态
- **HSTS**：启用HTTP Strict Transport Security，强制使用HTTPS

### 7.3 DNS安全

- **DNSSEC**：启用DNSSEC，防止DNS劫持
- **防DDoS**：使用Cloudflare等服务提供的DDoS防护
- **限制区域传输**：限制DNS区域传输，防止信息泄露

## 8. 测试方法

### 8.1 运行测试

```bash
node test/domain.test.js
```

### 8.2 功能测试

- **域名解析测试**：使用nslookup或dig命令测试域名解析
  ```bash
  nslookup huashuo.app
  dig huashuo.app
  ```

- **HTTPS测试**：使用浏览器或curl测试HTTPS访问
  ```bash
  curl -I https://huashuo.app
  ```

- **子域名测试**：测试子域名访问
  ```bash
  curl -I https://api.huashuo.app
  curl -I https://www.huashuo.app
  ```

- **证书测试**：使用SSL Labs测试证书配置
  ```
  https://www.ssllabs.com/ssltest/analyze.html?d=huashuo.app
  ```

### 8.3 性能测试

- **域名解析速度**：使用dig命令测试解析时间
  ```bash
  dig huashuo.app +time=1 +stats
  ```

- **HTTPS握手时间**：使用curl测试SSL握手时间
  ```bash
  curl -w "%{time_connect}\n" -o /dev/null -s https://huashuo.app
  ```

- **页面加载速度**：使用Lighthouse测试页面加载速度
  ```
  https://developers.google.com/speed/pagespeed/insights/
  ```

### 8.4 安全测试

- **SSL证书验证**：检查证书有效性和过期时间
  ```bash
  openssl s_client -connect huashuo.app:443 | grep -A 20 "Certificate chain"
  ```

- **HTTPS配置测试**：使用Mozilla Observatory测试HTTPS配置
  ```
  https://observatory.mozilla.org/
  ```

- **安全漏洞扫描**：使用安全扫描工具检查漏洞
  ```
  https://securityheaders.com/
  ```

## 9. 依赖关系

### 9.1 依赖模块

- **前端部署模块**：前端服务部署
- **后端部署模块**：后端服务部署

### 9.2 被依赖模块

- 无

## 10. 常见问题与解决方案

### 10.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 域名解析失败 | DNS记录配置错误或未生效 | 检查DNS记录配置，等待DNS更新生效（通常需要10-30分钟） |
| HTTPS访问失败 | SSL证书配置错误或过期 | 检查SSL证书状态，重新配置证书 |
| 子域名无法访问 | 子域名DNS记录配置错误 | 检查子域名DNS记录配置 |
| 证书过期 | 证书自动续期失败 | 手动更新证书，检查自动续期配置 |
| 域名被锁定 | 域名注册商锁定 | 联系域名注册商解锁域名 |

### 10.2 解决方案

1. **域名解析失败**：
   - 检查DNS记录配置是否正确
   - 使用nslookup或dig命令测试解析
   - 等待DNS更新生效（通常需要10-30分钟）
   - 清除本地DNS缓存

2. **HTTPS访问失败**：
   - 检查SSL证书状态
   - 使用SSL Labs测试证书配置
   - 重新配置SSL证书
   - 检查服务器HTTPS配置

3. **子域名无法访问**：
   - 检查子域名DNS记录配置
   - 测试子域名解析
   - 检查部署服务子域名配置

4. **证书过期**：
   - 手动更新SSL证书
   - 检查自动续期配置
   - 设置证书过期提醒

5. **域名被锁定**：
   - 联系域名注册商解锁域名
   - 检查域名注册信息
   - 确保域名续费及时

## 11. 生产环境建议

### 11.1 域名选择

- **品牌一致性**：选择与品牌一致的域名
- **易记性**：选择易记、简短的域名
- **多域名保护**：注册相关域名，防止被抢注
- **国际化**：考虑国际化域名，支持多语言

### 11.2 DNS管理

- **使用专业DNS服务**：使用Cloudflare或AWS Route 53等专业DNS服务
- **多区域部署**：配置多区域DNS，提高可靠性
- **监控DNS**：监控DNS解析状态，及时发现问题

### 11.3 HTTPS配置

- **使用Let's Encrypt**：免费且自动续期的SSL证书
- **配置HSTS**：启用HTTP Strict Transport Security
- **定期检查**：定期检查证书状态和配置

### 11.4 部署服务选择

- **前端部署**：Vercel或Netlify（自动HTTPS，全球CDN）
- **后端部署**：Heroku或AWS（可扩展性强）
- **监控服务**：配置服务监控，及时发现问题

### 11.5 安全措施

- **定期备份**：定期备份域名配置和DNS记录
- **安全审计**：定期进行安全审计，发现并修复漏洞
- **更新维护**：及时更新部署服务和依赖包
- **应急方案**：制定域名和服务故障的应急方案

## 12. 总结

域名配置模块是话说APP的重要组成部分，负责域名管理、DNS解析配置和HTTPS证书配置，确保应用能够通过自定义域名安全访问。

模块提供了完整的域名配置管理功能，包括：

- **域名管理**：支持主域名和子域名配置
- **DNS配置**：生成详细的DNS记录配置说明
- **HTTPS配置**：支持多种SSL证书提供商
- **部署服务配置**：生成不同部署服务的配置说明
- **配置验证**：验证域名配置的正确性

通过合理的域名配置和管理，可以提高应用的可访问性、安全性和可靠性。在生产环境中，建议选择专业的DNS服务和部署服务，配置适当的HTTPS证书，定期监控和维护域名状态，确保应用的稳定运行。