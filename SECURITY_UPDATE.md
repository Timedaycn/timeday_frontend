# 密码安全更新文档

## 概述

为了提高系统安全性，我们已经实现了前端密码加密传输功能。现在所有密码都会在前端进行SHA-256哈希加密后再发送到后端，确保密码不会以明文形式在网络中传输。

## 前端变更

### 新增文件
- `src/main/CryptoUtils.js` - 密码加密和验证工具类

### 修改文件
- `src/main/API.js` - 登录和注册接口现在发送密码哈希而非明文
- `src/main/Login.js` - 添加密码强度验证

## 后端API接口变更

### 1. 登录接口 `POST /api/auth/login`

**变更前：**
```json
{
  "username": "string",
  "password": "string"  // 明文密码
}
```

**变更后：**
```json
{
  "username": "string",
  "passwordHash": "string"  // SHA-256哈希值
}
```

### 2. 注册接口 `POST /api/auth/register`

**变更前：**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"  // 明文密码
}
```

**变更后：**
```json
{
  "username": "string",
  "email": "string",
  "passwordHash": "string"  // SHA-256哈希值
}
```

## 密码哈希算法详解

### 哈希生成过程

1. **盐值生成**：
   ```javascript
   // 基于用户名生成一致的盐值
   const salt = SHA256(username + 'SALT_SUFFIX_2024').substring(0, 32)
   ```

2. **密码哈希**：
   ```javascript
   // 将原始密码与盐值组合后进行SHA-256哈希
   const passwordHash = SHA256(password + salt)
   ```

### 后端验证逻辑

后端需要实现相同的哈希算法来验证密码：

```python
# Python示例
import hashlib

def generate_user_salt(username):
    """生成用户专用盐值"""
    salt_input = username + 'SALT_SUFFIX_2024'
    return hashlib.sha256(salt_input.encode()).hexdigest()[:32]

def hash_password(password, salt):
    """对密码进行哈希"""
    password_with_salt = password + salt
    return hashlib.sha256(password_with_salt.encode()).hexdigest()

def verify_password(username, password, stored_hash):
    """验证密码"""
    salt = generate_user_salt(username)
    password_hash = hash_password(password, salt)
    return password_hash == stored_hash
```

```javascript
// Node.js示例
const crypto = require('crypto');

function generateUserSalt(username) {
    const saltInput = username + 'SALT_SUFFIX_2024';
    return crypto.createHash('sha256').update(saltInput).digest('hex').substring(0, 32);
}

function hashPassword(password, salt) {
    const passwordWithSalt = password + salt;
    return crypto.createHash('sha256').update(passwordWithSalt).digest('hex');
}

function verifyPassword(username, password, storedHash) {
    const salt = generateUserSalt(username);
    const passwordHash = hashPassword(password, salt);
    return passwordHash === storedHash;
}
```

```java
// Java示例
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

public class PasswordUtils {
    
    public static String generateUserSalt(String username) {
        String saltInput = username + "SALT_SUFFIX_2024";
        return sha256(saltInput).substring(0, 32);
    }
    
    public static String hashPassword(String password, String salt) {
        String passwordWithSalt = password + salt;
        return sha256(passwordWithSalt);
    }
    
    public static boolean verifyPassword(String username, String password, String storedHash) {
        String salt = generateUserSalt(username);
        String passwordHash = hashPassword(password, salt);
        return passwordHash.equals(storedHash);
    }
    
    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hashing failed", e);
        }
    }
}
```

## 数据库迁移

### 现有用户密码迁移

如果数据库中已有用户数据，需要进行密码迁移：

1. **添加新字段**：
   ```sql
   ALTER TABLE users ADD COLUMN password_hash VARCHAR(64);
   ALTER TABLE users ADD COLUMN is_migrated BOOLEAN DEFAULT FALSE;
   ```

2. **迁移策略**：
   - 保留原有的明文密码字段（临时）
   - 用户下次登录时，使用明文密码验证，验证成功后立即转换为哈希格式
   - 标记用户为已迁移状态

3. **迁移代码示例**：
   ```python
   def migrate_user_password(username, plain_password):
       # 验证明文密码
       user = get_user_by_username(username)
       if user.password == plain_password:  # 简化的验证逻辑
           # 生成新的哈希密码
           salt = generate_user_salt(username)
           password_hash = hash_password(plain_password, salt)
           
           # 更新数据库
           update_user_password_hash(username, password_hash)
           mark_user_migrated(username)
           
           return True
       return False
   ```

## 安全特性

### 1. 盐值机制
- 每个用户都有基于用户名生成的唯一盐值
- 防止彩虹表攻击
- 即使两个用户使用相同密码，哈希值也不同

### 2. SHA-256算法
- 行业标准的安全哈希算法
- 单向不可逆，无法从哈希值推导出原始密码
- 抗碰撞性强

### 3. 前端验证
- 密码强度检查（长度、数字、字母要求）
- 实时反馈用户密码安全性

## 测试建议

### 1. 单元测试
```javascript
// 测试密码哈希一致性
test('password hashing consistency', async () => {
    const username = 'testuser';
    const password = 'testpass123';
    
    const hash1 = await CryptoUtils.hashPassword(password, await CryptoUtils.generateUserSalt(username));
    const hash2 = await CryptoUtils.hashPassword(password, await CryptoUtils.generateUserSalt(username));
    
    expect(hash1).toBe(hash2);
});
```

### 2. 集成测试
- 测试登录流程的完整性
- 验证前后端哈希算法一致性
- 测试密码强度验证

## 部署注意事项

1. **向后兼容**：确保在所有用户迁移完成前，后端同时支持新旧密码格式
2. **监控**：监控迁移进度和失败情况
3. **回滚计划**：准备回滚方案以防出现问题
4. **用户通知**：可选择性地通知用户密码安全性已提升

## 常见问题

### Q: 为什么不使用bcrypt或其他专门的密码哈希算法？
A: SHA-256配合盐值已经提供了足够的安全性，且实现简单，跨平台兼容性好。如需更高安全性，可以考虑升级到bcrypt。

### Q: 如果用户忘记密码怎么办？
A: 由于密码是单向哈希的，无法恢复原始密码。需要实现密码重置功能，通过邮箱验证等方式让用户设置新密码。

### Q: 前端加密是否足够安全？
A: 前端加密主要防止网络传输中的密码泄露。真正的安全还需要HTTPS、后端验证、数据库安全等多层保护。

---

**重要提醒**：请确保在生产环境部署前充分测试所有功能，特别是用户登录和注册流程。