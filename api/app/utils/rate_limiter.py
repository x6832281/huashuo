import time
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self.ip_requests = defaultdict(list)  # {ip: [timestamps]}
        self.device_requests = defaultdict(list)  # {device_id: [timestamps]}
        self.hug_requests = defaultdict(float)  # {f"{device_id}:{share_id}": timestamp}
        self.path_requests = defaultdict(lambda: defaultdict(list))  # {path: {ip: [timestamps]}}
    
    def is_ip_allowed(self, ip, limit=3, window=60):
        """检查IP是否允许请求"""
        current_time = time.time()
        timestamps = self.ip_requests[ip]
        
        # 清理过期的时间戳
        timestamps = [ts for ts in timestamps if current_time - ts < window]
        self.ip_requests[ip] = timestamps
        
        # 检查是否超过限制
        if len(timestamps) >= limit:
            return False
        
        # 记录新请求
        timestamps.append(current_time)
        return True
    
    def is_device_allowed(self, device_id, share_id=None, limit=1, window=86400):
        """检查设备是否允许请求"""
        current_time = time.time()
        
        if share_id:
            # 检查拥抱防刷
            key = f"{device_id}:{share_id}"
            if key in self.hug_requests:
                # 检查是否在24小时内
                last_hug_time = self.hug_requests[key]
                if current_time - last_hug_time < window:
                    return False
                else:
                    # 更新时间戳
                    self.hug_requests[key] = current_time
                    return True
            else:
                # 首次拥抱
                self.hug_requests[key] = current_time
                return True
        else:
            # 设备限流
            timestamps = self.device_requests[device_id]
            
            # 清理过期的时间戳
            timestamps = [ts for ts in timestamps if current_time - ts < window]
            self.device_requests[device_id] = timestamps
            
            # 检查是否超过限制
            if len(timestamps) >= limit:
                return False
            
            # 记录新请求
            timestamps.append(current_time)
            return True
    
    def is_path_allowed(self, ip, path, limits):
        """检查路径是否允许请求"""
        # 根据路径获取限制
        limit = limits.get(path, 3)
        window = 60  # 默认1分钟
        
        current_time = time.time()
        timestamps = self.path_requests[path].get(ip, [])
        
        # 清理过期的时间戳
        timestamps = [ts for ts in timestamps if current_time - ts < window]
        self.path_requests[path][ip] = timestamps
        
        # 检查是否超过限制
        if len(timestamps) >= limit:
            return False
        
        # 记录新请求
        timestamps.append(current_time)
        return True
    
    def clear_expired(self):
        """清理所有过期数据"""
        current_time = time.time()
        
        # 清理IP请求
        for ip, timestamps in list(self.ip_requests.items()):
            timestamps = [ts for ts in timestamps if current_time - ts < 60]
            if timestamps:
                self.ip_requests[ip] = timestamps
            else:
                del self.ip_requests[ip]
        
        # 清理设备请求
        for device_id, timestamps in list(self.device_requests.items()):
            timestamps = [ts for ts in timestamps if current_time - ts < 86400]
            if timestamps:
                self.device_requests[device_id] = timestamps
            else:
                del self.device_requests[device_id]
        
        # 清理拥抱请求
        for key, timestamp in list(self.hug_requests.items()):
            if current_time - timestamp >= 86400:
                del self.hug_requests[key]
        
        # 清理路径请求
        for path, ip_timestamps in list(self.path_requests.items()):
            for ip, timestamps in list(ip_timestamps.items()):
                timestamps = [ts for ts in timestamps if current_time - ts < 60]
                if timestamps:
                    self.path_requests[path][ip] = timestamps
                else:
                    del self.path_requests[path][ip]
            if not self.path_requests[path]:
                del self.path_requests[path]
    
    def get_stats(self):
        """获取限流统计信息"""
        return {
            "ip_requests_count": len(self.ip_requests),
            "device_requests_count": len(self.device_requests),
            "hug_requests_count": len(self.hug_requests),
            "path_requests_count": len(self.path_requests)
        }