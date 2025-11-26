/**
 * 圣经易经炒股大师 - 支付后端服务
 * * 运行前需安装依赖:
 * npm install express cors body-parser alipay-sdk wechat-pay axios uuid
 * * 启动命令:
 * node payment_server.js
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const AlipaySdk = require('alipay-sdk').default;
// 移除: const AlipayFormData = require('alipay-sdk/lib/form').default; 
// 原因: alipay.trade.precreate 接口返回 JSON，不需要构建表单，且新版 SDK 不支持此路径导入

// 微信支付库示例 (需根据实际选用的库调整)
// const WxPay = require('wechat-pay'); 

const app = express();
const PORT = 3000;

// 允许跨域，以便前端 html 可以调用
app.use(cors());
app.use(bodyParser.json());

// --- 配置区域 (需替换为您真实的商户信息) ---
const ALIPAY_CONFIG = {
    appId: '2021006112668754',
    privateKey: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCDTn6B3iDkttDI0N3I7z+7qtc/KyIHrMW/sugaEH5dIN4qvb6D4xafmCA0HP+nJk/fOA/cgenTtNdg+J0nxz5rYiWx2VSWvqCi3FCx/ljFbDu9+EeW27/N3mjXJOIQWt2TLxDlW3A5gkHbk3bQfPopTdSToCxeYLK8lF0sKCE1WFcA4eJSHLEpzgF3sfuIgWhoMnSUuicrR7OVqr33h+xE5qgxno+6ebpvmW7fw05GeLFauf19FzUa3lPGnAxJhh8vj9H4fjeTdQHBlSNflW+MdPWpF/35HOtpmjynRcf7wuuC0ID5paKsJm2bPoG9t32kG0NczGvSmHninAcrayCtAgMBAAECggEAOe/HiBvv3ZsAsqreQUu3jmHKSdgJUuOb+YLCQMXoS8U14hwI1P69O7wO8Y+eCi2wbmi5Lu2vs7cGlYX9KdETLKSIx1mCpmUEUffuLytwFeQ01BSZ2emqTvcEwXFHwjmlrMzGorze3rEnx+/gLAwJAXKTCnRRP29hTi4Ukmg+ht+Jf7ynxfj5f4G6iM4jramBXwiTA4NxQtv+o9Jx0DsjElQ3K3rogjXg777PjC4zOTqO1oD0QtsZ1UgkkK0GgRIuy+sGk1l8FyJgWtpbXx1xip/LRy4DZUDASDZti7uekIyrT9T1EVFN44a2HQaf/bMAM4jPKCpHElJZCzTN9S1aDQKBgQDRfh0HoTJQCJfXimDE/L2rFVMn1MIbAJp5xYjSaUq6UZ8iwf/OW79qeGKgbDFRbZhBdgrHTTJMAX9IZ7enMU7ozxHrn089u3capLPJPAiMLBvlGJbamWzrk3gs7UU/7Ac/DG6yHB7YdYheYGCpWbiaps8xYoBjOwllCZg3a55XkwKBgQCgdOmrRzI3ezedg9HgjyveChM9T0Ihe1wldjZtPray5dsWEaVJ9fMzMCrMnnTAcuAQjjzKKlcW5pdS5SH3I/LVZq5680JeapMLLXbgQakomwox4xmCde8AOe9D91w39W3SggMuGAO2MIVzmQ4ewDLsz7smjVldLSknjI20BaNOvwKBgA4Iap1mON6PlMxFYrIPVA0vwoA6ij4Qzkg16TJfBzhv2z8Sy7XhA3N4WPLyDGOt+bL420P6cdIRj5skB3NVpDmIFWU5KK+z7QiF290w/kmVctDn0sMV3+vv1u77fdYIU3vvs0KPC6noRZg80HzHm8wQPHTMalk7TSfNerrLpLGtAoGBAJDCqYXDB8USP0y2foTv5g2+XTk05l66opmRmuzYZY/k29F/PfYKFM2bqSFN29s8SHXnPWTO6h9ZDjDVU91Z610n9EYsbTYtRFgTPmp4Epr1tS7oyjzvFR7JJdnVsrcxj1EZxrCxLbgS8nMmJJ0NnWQUza2sXHE5qyVpIvbFF16VAoGBAKIU5NjHfnmwLYNRRc5e3puIRwUvMKqKp4kFSPy32jDDEJyT44RFBhfshfYs5iUqwz7inWEoPAoHjHef4t3YC+Li9iPhzkOgz86PSnq0tDJhHDw1a1bHMoKQrXdXaV93qsc+MxmKCFObkokIfYy6JOsxnC1UF174mWgAp2Bg3Dg1',
    alipayPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlfGw+70u25QfgKHpyN3WukjZgCcpZagz90K5P10gmmx7ZGHVTHO+h1VhqwGtf+jc1ZwbVeeV2e6WNHXO5i31rxbDrVHCNGlbWskqMZ5csfQExfMAVidCLRqYp9nrht8mc34+Xes4YLkDFIdJ+I0Ky1e9Zx6UNQZZAT/lmOb9tQFaZ4uajlVFuBCU5GeofqxedY6zCMTbJ59bPXUkKczIz76TjwaweIAVZSXLEt30eEZILMAO9UZRRCpjhixH7IlZ2KjKfhAXWkP8M57iCQl2x//9BppCfIVfgkTYJsFTA6mFUQ4QNVQVnOdrCtjlZ9ffip5VZ3Yp0Rk0eLwPGZytxQIDAQAB',
    gateway: 'https://openapi.alipay.com/gateway.do'
};

const WXPAY_CONFIG = {
    appid: 'YOUR_WX_APP_ID',
    mchid: 'YOUR_WX_MCH_ID',
    publicKey: 'YOUR_WX_CERT_PEM',
    privateKey: 'YOUR_WX_KEY_PEM',
};

// 初始化支付宝 SDK
const alipaySdk = new AlipaySdk(ALIPAY_CONFIG);

// 模拟数据库存储订单状态
// Key: orderId, Value: { status: 'PENDING' | 'SUCCESS', amount: 8.88 }
const ordersDB = new Map();

/**
 * 1. 创建支付宝订单接口
 * 前端请求此接口，获取二维码链接
 */
app.post('/api/create-alipay-order', async (req, res) => {
    const orderId = uuidv4();
    const amount = '8.88';

    // 移除: 不需要 AlipayFormData，直接调用 exec 即可

    try {
        // 调用支付宝 "当面付" (Pre-create) 接口生成二维码
        // 文档: https://opendocs.alipay.com/open/02ekfg?scene=19
        const result = await alipaySdk.exec('alipay.trade.precreate', {
            bizContent: {
                out_trade_no: orderId,
                total_amount: amount,
                subject: '天启易经-VIP香火供奉',
                product_code: 'FACE_TO_FACE_PAYMENT',
            }
        });

        // 保存订单状态
        ordersDB.set(orderId, { status: 'PENDING', type: 'alipay' });

        // 返回二维码链接 (qr_code)
        res.json({
            success: true,
            orderId: orderId,
            qrCodeUrl: result.qr_code // 前端需将此 URL 转换为二维码图片
        });

    } catch (error) {
        console.error('Alipay Error:', error);
        res.status(500).json({ success: false, message: '支付通道繁忙: ' + error.message });
    }
});

/**
 * 2. 创建微信订单接口 (Native 扫码)
 */
app.post('/api/create-wechat-order', async (req, res) => {
    const orderId = uuidv4();
    
    // 伪代码演示微信统一下单逻辑
    try {
        // const result = await wxPay.transactions_native({...});
        // const code_url = result.code_url;
        
        // 模拟返回
        const mockCodeUrl = "weixin://wxpay/bizpayurl?pr=MockData"; 
        
        ordersDB.set(orderId, { status: 'PENDING', type: 'wechat' });

        res.json({
            success: true,
            orderId: orderId,
            qrCodeUrl: mockCodeUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '微信支付初始化失败' });
    }
});

/**
 * 3. 支付回调通知 (Webhook)
 * 支付宝/微信服务器会调用此接口通知支付成功
 */
app.post('/api/notify/alipay', (req, res) => {
    // 1. 验签 (验证确实是支付宝发的)
    // 2. 更新数据库状态
    const params = req.body;
    const orderId = params.out_trade_no;
    
    if (params.trade_status === 'TRADE_SUCCESS') {
        if (ordersDB.has(orderId)) {
            const order = ordersDB.get(orderId);
            order.status = 'SUCCESS';
            ordersDB.set(orderId, order);
            console.log(`Order ${orderId} paid successfully!`);
        }
    }
    res.send('success');
});

/**
 * 4. 前端轮询接口
 * 前端每隔几秒调用一次，检查订单是否变更为 SUCCESS
 */
app.get('/api/check-order-status/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const order = ordersDB.get(orderId);

    if (!order) {
        return res.json({ status: 'NOT_FOUND' });
    }

    res.json({ status: order.status });
});

app.listen(PORT, () => {
    console.log(`Payment Server running on http://localhost:${PORT}`);

});
