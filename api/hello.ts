import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch'; // Cần cài đặt: npm install node-fetch@2 Hoặc dùng fetch có sẵn trong Node 18+

// --- CẤU HÌNH CẦN THAY ĐỔI ---
// Lưu trữ các giá trị này dưới dạng Environment Variables trên Vercel để bảo mật
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760e8cffc389029';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || '5DkLrc6xvHH50utrIkoE4dUDjGvBX0ei';
const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng

const WEB_DEMO_API_URL = 'https://1256763111-f2tvymu35g.ap-beijing.tencentscf.com/orderList';
// --- KẾT THÚC CẤU HÌNH ---

// Hàm lấy Tenant Access Token của Lark
async function getLarkTenantAccessToken(): Promise<string | null> {
    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                app_id: LARK_APP_ID,
                app_secret: LARK_APP_SECRET,
            }),
        });
        const data: any = await response.json();
        if (data.code === 0 && data.tenant_access_token) {
            console.log('Lấy Tenant Access Token thành công.');
            return data.tenant_access_token;
        } else {
            console.error('Lỗi khi lấy Tenant Access Token:', data);
            return null;
        }
    } catch (error) {
        console.error('Lỗi mạng hoặc lỗi khác khi lấy Tenant Access Token:', error);
        return null;
    }
}

// Hàm lấy dữ liệu từ Web Demo API
// (Tái sử dụng logic từ hàm getOrder() của bạn, nhưng trả về dữ liệu thô)
async function fetchDataFromWebDemo(): Promise<any[] | null> {
    // Ví dụ: lấy dữ liệu trong 5 phút vừa qua. Bạn cần điều chỉnh logic ngày tháng này.
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const startDateTimestamp = Math.floor(fiveMinutesAgo.getTime() / 1000);
    const endDateTimestamp = Math.floor(now.getTime() / 1000);
    const searchValue = ''; // Hoặc một giá trị cụ thể nếu cần

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "orderType": "" }), // Giống như trong code web demo của bạn
    };

    const urlWithParams = `${WEB_DEMO_API_URL}?startDate=${startDateTimestamp}&endDate=${endDateTimestamp}&search=${searchValue}`;

    try {
        console.log('Đang lấy dữ liệu từ Web Demo API:', urlWithParams);
        const response = await fetch(urlWithParams, requestOptions);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP khi gọi Web Demo API: ${response.status} ${await response.text()}`);
        }
        const result: any[] = await response.json();
        console.log(`Lấy được ${result.length} bản ghi từ Web Demo.`);
        return result;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ Web Demo API:', error);
        return null;
    }
}

// Hàm chuyển đổi dữ liệu từ Web Demo sang định dạng của Lark Base Record
// QUAN TRỌNG: Bạn cần ánh xạ đúng các chỉ số (element[X]) sang TÊN CỘT hoặc FIELD ID trong Lark Base
function transformDataForLark(webDemoData: any[]): Array<{ fields: Record<string, any> }> {
    return webDemoData.map(element => {
        // Ví dụ ánh xạ - HÃY THAY THẾ BẰNG TÊN CỘT HOẶC FIELD ID THỰC TẾ CỦA BẠN
        const checkInTimestamp = element[7];
        const checkOutTimestamp = element[8];
        const totalNights = calculateTotalNights(checkInTimestamp, checkOutTimestamp); // Giả sử hàm này đã có

        return {
            fields: {
                // THAY "Tên Cột Trong Lark 1" bằng tên cột hoặc field ID thực tế
                "Order Number": element[0] || '',
                "Platform": element[1] || '',
                // "Phone": element[2] || '',
                // // "Cancellation Fee": formatCurrency(element[4]), // formatCurrency có thể cần điều chỉnh
                // "Room Type": element[5] || '',
                // "Booking Time": getDay(element[6]), // getDay và formatCurrency cần được định nghĩa hoặc import
                // "Check In": getDay(checkInTimestamp),
                // "Check Out": getDay(checkOutTimestamp),
                // // "Price": formatCurrency(element[9]),
                // "Guest Name": element[10] || '',
                // "Room ID": element[11] || '',
                // "Status Order": element[12] ? element[12] : 'Confirmed',
                // "Total Nights": totalNights !== '' ? totalNights : null, // Gửi null nếu không có giá trị
                // "Price Per Night": nightlyRate, // Cần tính toán nightlyRate
                // THÊM CÁC TRƯỜNG KHÁC Ở ĐÂY
            }
        };
    });
}

// Hàm gửi dữ liệu đến Lark Base (sử dụng batch_create)
async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<boolean> {
    if (!records || records.length === 0) {
        console.log('Không có bản ghi nào để gửi đến Lark Base.');
        return true; // Coi như thành công vì không có gì để làm
    }

    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
    try {
        console.log(`Đang gửi ${records.length} bản ghi đến Lark Base...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({ records }),
        });
        const data: any = await response.json();
        if (data.code === 0) {
            console.log('Gửi dữ liệu đến Lark Base thành công:', data.data?.records?.length || 0, 'bản ghi đã tạo/cập nhật.');
            return true;
        } else {
            console.error('Lỗi khi gửi dữ liệu đến Lark Base:', data);
            return false;
        }
    } catch (error) {
        console.error('Lỗi mạng hoặc lỗi khác khi gửi dữ liệu đến Lark Base:', error);
        return false;
    }
}

// --- Helper functions (copy từ code web demo của bạn, có thể cần điều chỉnh) ---
function getDay(timestampInSeconds: number): string | '' {
    if (!timestampInSeconds) return '';
    const date = new Date(timestampInSeconds * 1000);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateTotalNights(checkinTimestamp: number, checkoutTimestamp: number): number | '' {
    if (!checkinTimestamp || !checkoutTimestamp) return '';
    try {
        const checkinDate = new Date(checkinTimestamp * 1000);
        const checkoutDate = new Date(checkoutTimestamp * 1000);
        if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) return '';
        checkinDate.setHours(12, 0, 0, 0);
        checkoutDate.setHours(12, 0, 0, 0);
        const diffTime = checkoutDate.getTime() - checkinDate.getTime();
        const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffNights >= 0 ? diffNights : ''; // Trả về 0 nếu cùng ngày
    } catch (e) {
        console.error("Lỗi khi tính số đêm:", e);
        return '';
    }
}
// Bạn có thể cần hàm formatCurrency nếu các trường Price trong Lark Base là kiểu Text
// Nếu là Number/Currency thì không cần format ở đây, mà chỉ gửi số thô.
// function formatCurrency(value: any): string { ... }

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('Bắt đầu quá trình đồng bộ dữ liệu...');

    // Bước 1: Lấy Lark Tenant Access Token
    const larkAccessToken = await getLarkTenantAccessToken();
    if (!larkAccessToken) {
        console.error('Không thể lấy Lark Access Token. Dừng quá trình.');
        return res.status(500).json({ success: false, message: 'Failed to get Lark access token.' });
    }

    // Bước 2: Lấy dữ liệu từ Web Demo
    const webDemoData = await fetchDataFromWebDemo();
    if (!webDemoData) {
        console.warn('Không lấy được dữ liệu từ Web Demo hoặc có lỗi. Dừng quá trình.');
        // Có thể bạn muốn trả về success true ở đây để cron job không coi là lỗi liên tục
        // nếu việc không có dữ liệu là bình thường.
        return res.status(200).json({ success: true, message: 'No data fetched from web demo or an error occurred during fetch.' });
    }
    if (webDemoData.length === 0) {
        console.log('Không có dữ liệu mới từ Web Demo để đồng bộ.');
        return res.status(200).json({ success: true, message: 'No new data from web demo to sync.' });
    }

    // Bước 3: Chuyển đổi dữ liệu
    const recordsForLark = transformDataForLark(webDemoData);
    if (recordsForLark.length === 0 && webDemoData.length > 0) {
        console.warn('Dữ liệu Web Demo có nhưng không chuyển đổi được bản ghi nào cho Lark.');
         return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark.' });
    }


    // Bước 4: Gửi dữ liệu đến Lark Base
    const успіх = await sendDataToLarkBase(larkAccessToken, recordsForLark);

    if (успіх) {
        console.log('Quá trình đồng bộ hoàn tất thành công.');
        return res.status(200).json({ success: true, message: 'Data synced to Lark Base successfully.' });
    } else {
        console.error('Quá trình đồng bộ thất bại.');
        return res.status(500).json({ success: false, message: 'Failed to send data to Lark Base.' });
    }
}