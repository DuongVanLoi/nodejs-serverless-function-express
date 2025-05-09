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

async function getLarkTenantAccessToken(): Promise<string | null> {
    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
        });
        const data: any = await response.json();
        if (data.code === 0 && data.tenant_access_token) {
            console.log('Lấy Tenant Access Token thành công.');
            return data.tenant_access_token;
        } else {
            console.error('Lỗi khi lấy Tenant Access Token:', JSON.stringify(data));
            return null;
        }
    } catch (error) {
        console.error('Lỗi mạng hoặc lỗi khác khi lấy Tenant Access Token:', error);
        return null;
    }
}

async function fetchDataFromWebDemo(): Promise<any[] | null> {
    const now = new Date();
    const pastDate = new Date(now.getTime() - DATA_FETCH_DAYS_AGO * 24 * 60 * 60 * 1000);

    const startDateTimestamp = Math.floor(pastDate.getTime() / 1000);
    const endDateTimestamp = Math.floor(now.getTime() / 1000);
    const searchValue = ''; // Điều chỉnh nếu cần

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "orderType": "" }),
    };
    const urlWithParams = `${WEB_DEMO_API_URL}?startDate=${startDateTimestamp}&endDate=${endDateTimestamp}&search=${searchValue}`;

    try {
        console.log(`Đang lấy dữ liệu từ Web Demo API (${DATA_FETCH_DAYS_AGO} ngày qua):`, urlWithParams);
        const response = await fetch(urlWithParams, requestOptions);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Lỗi HTTP khi gọi Web Demo API: ${response.status}`, errorText);
            throw new Error(`HTTP Error ${response.status} from Web Demo API`);
        }
        const result: any[] = await response.json();
        console.log(`Lấy được ${result.length} bản ghi từ Web Demo.`);
        if (!Array.isArray(result)) {
            console.error('Dữ liệu trả về từ Web Demo API không phải là một mảng:', result);
            return []; // Trả về mảng rỗng nếu không phải mảng
        }
        return result;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ Web Demo API:', error);
        return null;
    }
}

// QUAN TRỌNG: ĐIỀU CHỈNH HÀM NÀY CHO KHỚP VỚI BẢNG LARK BASE CỦA BẠN
function transformDataForLark(webDemoData: any[]): Array<{ fields: Record<string, any> }> {
    if (!webDemoData || webDemoData.length === 0) {
        return [];
    }
    return webDemoData.map(element => {
        const checkInTimestamp = element[7];
        const checkOutTimestamp = element[8];
        const bookingTimestamp = element[6];
        const totalNightsCalculated = calculateTotalNights(checkInTimestamp, checkOutTimestamp);

        const fieldsForLark: Record<string, any> = {
            // THAY THẾ CÁC KEY BÊN DƯỚI BẰNG FIELD ID hoặc TÊN CỘT CHÍNH XÁC TRONG LARK BASE
            "Order Code": `${element[1] || ''}-${element[0] || ''}`, // Ví dụ: dùng Field ID: "fldxxxxxxxxxx": "value"
            //"Order No.": element[0] || '',
            // "Platform": element[1] || '', // Giả sử cột "Platform" trong Lark Base
            // "Building Name": element[5] || '',
            // "Check in Date": getDay(checkInTimestamp), // Giả sử cột "Check in Date"
            // "Guest Name": element[10] || '',
            // "Check Out Date": getDay(checkOutTimestamp),
            // "Total Nights": totalNightsCalculated !== '' ? totalNightsCalculated : null,
            // "Phone": element[2] || '',
            // "Price": element[9] ? (parseFloat(String(element[9]).replace(/,/g, '')) || null) : null, // Gửi số
            // "Status Order": element[12] ? element[12] : 'Confirmed',
            // "Booking Date": getDay(bookingTimestamp),
            // "Room ID (text)": element[11] || '', // Giả sử lưu Room ID dạng text
            // // ... thêm các trường khác bạn muốn đồng bộ
        };
        return { fields: fieldsForLark };
    }).filter(record => record.fields && Object.keys(record.fields).length > 0); // Đảm bảo không gửi bản ghi rỗng
}


async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<boolean> {
    if (!records || records.length === 0) {
        console.log('Không có bản ghi nào để gửi đến Lark Base.');
        return true;
    }
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
    try {
        console.log(`Đang gửi ${records.length} bản ghi đến Lark Base... URL: ${url}`);
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
            console.log('Gửi dữ liệu đến Lark Base thành công:', data.data?.records?.length || 0, 'bản ghi đã được xử lý.');
            return true;
        } else {
            console.error('Lỗi khi gửi dữ liệu đến Lark Base:', JSON.stringify(data));
            return false;
        }
    } catch (error) {
        console.error('Lỗi mạng hoặc lỗi khác khi gửi dữ liệu đến Lark Base:', error);
        return false;
    }
}

// --- Helper functions ---
function getDay(timestampInSeconds: number | null | undefined): string | '' {
    if (timestampInSeconds === null || timestampInSeconds === undefined || timestampInSeconds === 0) return '';
    const date = new Date(timestampInSeconds * 1000);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateTotalNights(checkinTimestamp: number | null | undefined, checkoutTimestamp: number | null | undefined): number | '' {
    if (!checkinTimestamp || !checkoutTimestamp) return '';
    try {
        const checkinDate = new Date(checkinTimestamp * 1000);
        const checkoutDate = new Date(checkoutTimestamp * 1000);
        if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) return '';
        checkinDate.setHours(12, 0, 0, 0);
        checkoutDate.setHours(12, 0, 0, 0);
        const diffTime = checkoutDate.getTime() - checkinDate.getTime();
        if (diffTime < 0) return ''; // Check out trước check in
        const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffNights;
    } catch (e) {
        console.error("Lỗi khi tính số đêm:", e);
        return '';
    }
}

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('Bắt đầu quá trình đồng bộ dữ liệu...');

    const larkAccessToken = await getLarkTenantAccessToken();
    if (!larkAccessToken) {
        console.error('Không thể lấy Lark Access Token. Dừng quá trình.');
        return res.status(500).json({ success: false, message: 'Failed to get Lark access token.' });
    }

    const webDemoData = await fetchDataFromWebDemo();
    if (webDemoData === null) { // Lỗi khi fetch
        console.warn('Không lấy được dữ liệu từ Web Demo hoặc có lỗi. Dừng quá trình.');
        return res.status(500).json({ success: false, message: 'Failed to fetch data from web demo.' });
    }
    if (webDemoData.length === 0) {
        console.log('Không có dữ liệu mới từ Web Demo để đồng bộ.');
        return res.status(200).json({ success: true, message: 'No new data from web demo to sync.' });
    }

    const recordsForLark = transformDataForLark(webDemoData);
    if (recordsForLark.length === 0 && webDemoData.length > 0) {
        console.warn('Dữ liệu Web Demo có nhưng không chuyển đổi được bản ghi nào cho Lark (có thể do lỗi ánh xạ hoặc dữ liệu không hợp lệ).');
        return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark. Check mapping.' });
    }
     if (recordsForLark.length === 0) {
        console.log('Không có bản ghi hợp lệ nào sau khi chuyển đổi để gửi đến Lark.');
        return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
    }


    const CHUNK_SIZE = 450; // Gửi ít hơn 500 một chút để an toàn
    let allChunksSentSuccessfully = true;
    let totalRecordsProcessedInLark = 0;

    console.log(`Tổng số bản ghi cần gửi: ${recordsForLark.length}. Chia thành các lô ${CHUNK_SIZE} bản ghi.`);

    for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE) {
        const chunk = recordsForLark.slice(i, i + CHUNK_SIZE);
        console.log(`Đang xử lý lô từ index ${i} đến ${i + chunk.length - 1}`);
        const success = await sendDataToLarkBase(larkAccessToken, chunk);
        if (success) {
            // Giả sử API trả về số lượng bản ghi đã xử lý nếu cần, ở đây ta cộng dồn số lượng gửi đi
            totalRecordsProcessedInLark += chunk.length;
        } else {
            allChunksSentSuccessfully = false;
            console.error(`Lỗi khi gửi lô dữ liệu từ index ${i}. Dừng gửi các lô tiếp theo.`);
            break; // Dừng lại nếu có lỗi ở một lô
        }

        // Thêm delay nhỏ giữa các lô nếu cần để tránh rate limit, đặc biệt nếu có nhiều lô
        if (recordsForLark.length > CHUNK_SIZE && i + CHUNK_SIZE < recordsForLark.length) {
            console.log('Đang tạm dừng 1 giây trước khi gửi lô tiếp theo...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 giây delay
        }
    }

    if (allChunksSentSuccessfully) {
        console.log(`Quá trình đồng bộ hoàn tất. Tổng cộng ${totalRecordsProcessedInLark} bản ghi có thể đã được xử lý bởi Lark.`);
        return res.status(200).json({ success: true, message: `Data sync completed. Approximately ${totalRecordsProcessedInLark} records may have been processed by Lark.` });
    } else {
        console.error('Quá trình đồng bộ thất bại ở một số lô.');
        return res.status(500).json({ success: false, message: 'Failed to send some data chunks to Lark Base.' });
    }
}