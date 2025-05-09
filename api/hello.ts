import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch'; // Cần cài đặt: npm install node-fetch@2 Hoặc dùng fetch có sẵn trong Node 18+

// --- CẤU HÌNH CẦN THAY ĐỔI ---
// Lưu trữ các giá trị này dưới dạng Environment Variables trên Vercel để bảo mật
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760e8cffc389029';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || '5DkLrc6xvHH50utrIkoE4dUDjGvBX0ei';
const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng
const DATA_FETCH_DAYS_AGO = 7;

const WEB_DEMO_API_URL = 'https://1256763111-f2tvymu35g.ap-beijing.tencentscf.com/orderList';
// --- KẾT THÚC CẤU HÌNH ---

async function getLarkTenantAccessToken(): Promise<string | null> {
    console.log('[LOG] getLarkTenantAccessToken: Bắt đầu lấy token...');
    if (!LARK_APP_ID || LARK_APP_ID === 'YOUR_LARK_APP_ID_PLACEHOLDER' || !LARK_APP_SECRET || LARK_APP_SECRET === 'YOUR_LARK_APP_SECRET_PLACEHOLDER') {
        console.error('[LOG] getLarkTenantAccessToken: LARK_APP_ID hoặc LARK_APP_SECRET chưa được cấu hình đúng.');
        return null;
    }
    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
        });
        const responseText = await response.text(); // Đọc text trước
        if (!response.ok) {
            console.error('[LOG] getLarkTenantAccessToken: Lỗi HTTP từ API Lark Auth:', response.status, responseText);
            return null;
        }
        try {
            const data: any = JSON.parse(responseText);
            if (data.code === 0 && data.tenant_access_token) {
                console.log('[LOG] getLarkTenantAccessToken: Lấy Tenant Access Token thành công.');
                return data.tenant_access_token;
            } else {
                console.error('[LOG] getLarkTenantAccessToken: Lỗi logic từ API Lark Auth:', responseText);
                return null;
            }
        } catch (jsonError) {
            console.error('[LOG] getLarkTenantAccessToken: Lỗi parse JSON từ API Lark Auth:', jsonError, 'Dữ liệu text nhận được:', responseText);
            return null;
        }
    } catch (error) {
        console.error('[LOG] getLarkTenantAccessToken: Lỗi mạng hoặc lỗi khác:', error);
        return null;
    }
}

async function fetchDataFromWebDemo(): Promise<any[] | null> {
    console.log('[LOG] fetchDataFromWebDemo: Bắt đầu lấy dữ liệu từ web demo...');
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
    console.log(`[LOG] fetchDataFromWebDemo: URL gọi Web Demo API (${DATA_FETCH_DAYS_AGO} ngày qua):`, urlWithParams);

    try {
        const response = await fetch(urlWithParams, requestOptions);
        const responseText = await response.text();
        if (!response.ok) {
            console.error(`[LOG] fetchDataFromWebDemo: Lỗi HTTP khi gọi Web Demo API: ${response.status}`, responseText);
            throw new Error(`HTTP Error ${response.status} from Web Demo API: ${responseText}`);
        }
        try {
            const result: any = JSON.parse(responseText);
            // Log một phần nhỏ để tránh làm tràn log nếu dữ liệu quá lớn
            console.log('[LOG] fetchDataFromWebDemo: Dữ liệu thô từ Web Demo API (ví dụ 2 bản ghi đầu hoặc 500 chars):',
                JSON.stringify(Array.isArray(result) ? result.slice(0,2) : result).substring(0, 500) + (JSON.stringify(Array.isArray(result) ? result.slice(0,2) : result).length > 500 ? '...' : ''));

            if (!Array.isArray(result)) {
                console.error('[LOG] fetchDataFromWebDemo: Dữ liệu trả về không phải là một mảng:', result);
                return []; // Trả về mảng rỗng để các bước sau không lỗi
            }
            console.log(`[LOG] fetchDataFromWebDemo: Lấy được ${result.length} bản ghi.`);
            return result;
        } catch (jsonError) {
            console.error('[LOG] fetchDataFromWebDemo: Lỗi parse JSON từ Web Demo API:', jsonError, 'Dữ liệu text nhận được:', responseText);
            return null; // Hoặc trả về mảng rỗng [] nếu muốn tiếp tục xử lý với dữ liệu rỗng
        }
    } catch (error) {
        console.error('[LOG] fetchDataFromWebDemo: Lỗi khi lấy dữ liệu:', error);
        return null;
    }
}

// QUAN TRỌNG: BẠN PHẢI ĐIỀU CHỈNH HÀM NÀY CHO KHỚP VỚI BẢNG LARK BASE CỦA BẠN
function transformDataForLark(webDemoData: any[]): Array<{ fields: Record<string, any> }> {
    console.log(`[LOG] transformDataForLark: Bắt đầu chuyển đổi ${webDemoData ? webDemoData.length : 0} bản ghi...`);
    if (!webDemoData || !Array.isArray(webDemoData) || webDemoData.length === 0) {
        console.log('[LOG] transformDataForLark: Không có dữ liệu đầu vào hoặc không phải mảng.');
        return [];
    }
    const transformedRecords = webDemoData.map(element => {
        if (!Array.isArray(element)) { // Kiểm tra nếu element không phải là mảng
            console.warn('[LOG] transformDataForLark: Bỏ qua phần tử không phải mảng trong webDemoData:', element);
            return null; // Bỏ qua phần tử này
        }
        const checkInTimestamp = element[7];
        const checkOutTimestamp = element[8];
        const bookingTimestamp = element[6];
        const totalNightsCalculated = calculateTotalNights(checkInTimestamp, checkOutTimestamp);

        // ĐỐI TƯỢNG NÀY CẦN ĐƯỢC ÁNH XẠ ĐÚNG VỚI FIELD ID HOẶC TÊN CỘT TRONG LARK BASE
        const fieldsForLark: Record<string, any> = {
            // Ví dụ (thay thế bằng Field ID hoặc tên cột thực tế):
            "fldTENCOT1": element[0] || '',         // Ví dụ: Order Number
            "fldTENCOT2": element[1] || '',         // Ví dụ: Platform
            "fldTENCOT3": getDay(checkInTimestamp), // Ví dụ: Check In Date
            "fldTENCOT4": element[10] || '',        // Ví dụ: Guest Name
            // ... thêm tất cả các trường bạn cần ánh xạ
            // Ví dụ cho cột Price (Number/Currency)
            // "fldGIA_TIEN": element[9] ? (parseFloat(String(element[9]).replace(/,/g, '')) || null) : null,
        };
        // Log cấu trúc của một bản ghi đã transform để kiểm tra
        if (transformedRecords.length < 2) { // Chỉ log 2 bản ghi đầu
             console.log('[LOG] transformDataForLark: Ví dụ bản ghi đã transform:', JSON.stringify({ fields: fieldsForLark }));
        }
        return { fields: fieldsForLark };
    }).filter(record => record && record.fields && Object.keys(record.fields).length > 0); // Lọc bỏ các record có fields rỗng hoặc null

    console.log(`[LOG] transformDataForLark: Chuyển đổi thành công ${transformedRecords.length} bản ghi.`);
    return transformedRecords;
}

async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<boolean> {
    console.log(`[LOG] sendDataToLarkBase: Bắt đầu gửi ${records.length} bản ghi...`);
    if (!records || records.length === 0) {
        console.log('[LOG] sendDataToLarkBase: Không có bản ghi nào để gửi.');
        return true;
    }
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
    console.log(`[LOG] sendDataToLarkBase: URL Lark Base API: ${url}`);
    console.log('[LOG] sendDataToLarkBase: Dữ liệu gửi đi (ví dụ 1 bản ghi):', JSON.stringify(records.length > 0 ? { records: [records[0]] } : { records: [] }, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({ records }), // Gửi toàn bộ mảng records
        });
        const responseText = await response.text();
        if (!response.ok) {
            console.error(`[LOG] sendDataToLarkBase: Lỗi HTTP từ API Lark Base: ${response.status}`, responseText);
            return false;
        }
        try {
            const data: any = JSON.parse(responseText);
            if (data.code === 0) {
                console.log('[LOG] sendDataToLarkBase: Gửi dữ liệu đến Lark Base thành công:', data.data?.records?.length || 0, 'bản ghi đã được xử lý.');
                return true;
            } else {
                console.error('[LOG] sendDataToLarkBase: Lỗi logic từ API Lark Base:', responseText); // Log toàn bộ responseText
                return false;
            }
        } catch (jsonError) {
            console.error('[LOG] sendDataToLarkBase: Lỗi parse JSON từ Lark Base API:', jsonError, 'Dữ liệu text nhận được:', responseText);
            return false;
        }
    } catch (error) {
        console.error('[LOG] sendDataToLarkBase: Lỗi mạng hoặc lỗi khác:', error);
        return false;
    }
}

// --- Helper functions (Giữ nguyên từ code trước) ---
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
        if (diffTime < 0) {
            console.warn("[LOG] calculateTotalNights: Ngày check-out trước ngày check-in.");
            return '';
        }
        const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffNights;
    } catch (e) {
        console.error("[LOG] calculateTotalNights: Lỗi khi tính số đêm:", e);
        return '';
    }
}
// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('[LOG] Handler: Bắt đầu quá trình đồng bộ dữ liệu...');
    // Log các biến môi trường khi debug (che bớt nếu nhạy cảm)
    console.log(`[LOG] Handler: LARK_APP_ID is set: ${!!process.env.LARK_APP_ID}`);
    console.log(`[LOG] Handler: LARK_APP_SECRET is set: ${!!process.env.LARK_APP_SECRET}`);
    console.log(`[LOG] Handler: LARK_BASE_APP_TOKEN is set: ${!!process.env.LARK_BASE_APP_TOKEN}`);
    console.log(`[LOG] Handler: LARK_TABLE_ID is set: ${!!process.env.LARK_TABLE_ID}`);


    try {
        const larkAccessToken = await getLarkTenantAccessToken();
        if (!larkAccessToken) {
            console.error('[LOG] Handler: Không thể lấy Lark Access Token. Dừng quá trình.');
            return res.status(500).json({ success: false, message: 'Failed to get Lark access token. Check LARK_APP_ID and LARK_APP_SECRET.' });
        }
        console.log('[LOG] Handler: Đã lấy được Lark Access Token.');

        const webDemoData = await fetchDataFromWebDemo();
        if (webDemoData === null) {
            console.warn('[LOG] Handler: Không lấy được dữ liệu từ Web Demo hoặc có lỗi. Dừng quá trình.');
            return res.status(500).json({ success: false, message: 'Failed to fetch data from web demo.' });
        }
        console.log(`[LOG] Handler: Đã lấy được ${webDemoData.length} bản ghi từ Web Demo.`);

        if (webDemoData.length === 0) {
            console.log('[LOG] Handler: Không có dữ liệu mới từ Web Demo để đồng bộ.');
            return res.status(200).json({ success: true, message: 'No new data from web demo to sync.' });
        }

        const recordsForLark = transformDataForLark(webDemoData);
        console.log(`[LOG] Handler: Đã chuyển đổi ${recordsForLark.length} bản ghi cho Lark.`);

        if (recordsForLark.length === 0 && webDemoData.length > 0) {
            console.warn('[LOG] Handler: Dữ liệu Web Demo có nhưng không chuyển đổi được bản ghi nào cho Lark (kiểm tra logic transformDataForLark và dữ liệu đầu vào).');
            return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark. Check mapping and input data.' });
        }
         if (recordsForLark.length === 0) {
            console.log('[LOG] Handler: Không có bản ghi hợp lệ nào sau khi chuyển đổi để gửi đến Lark.');
            return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
        }

        const CHUNK_SIZE = 450;
        let allChunksSentSuccessfully = true;
        let totalRecordsProcessedInLark = 0;
        console.log(`[LOG] Handler: Tổng số bản ghi cần gửi: ${recordsForLark.length}. Chia thành các lô ${CHUNK_SIZE} bản ghi.`);

        for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE) {
            const chunk = recordsForLark.slice(i, i + CHUNK_SIZE);
            console.log(`[LOG] Handler: Đang xử lý lô từ index ${i} đến ${i + chunk.length - 1}, kích thước lô: ${chunk.length}`);
            const success = await sendDataToLarkBase(larkAccessToken, chunk);
            if (success) {
                totalRecordsProcessedInLark += chunk.length; // Hoặc lấy từ response của API Lark nếu có
            } else {
                allChunksSentSuccessfully = false;
                console.error(`[LOG] Handler: Lỗi khi gửi lô dữ liệu từ index ${i}. Dừng gửi các lô tiếp theo.`);
                break;
            }
            if (recordsForLark.length > CHUNK_SIZE && i + CHUNK_SIZE < recordsForLark.length) {
                console.log('[LOG] Handler: Đang tạm dừng 1 giây trước khi gửi lô tiếp theo...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (allChunksSentSuccessfully) {
            console.log(`[LOG] Handler: Quá trình đồng bộ hoàn tất. Tổng cộng ${totalRecordsProcessedInLark} bản ghi có thể đã được xử lý bởi Lark.`);
            return res.status(200).json({ success: true, message: `Data sync completed. Approximately ${totalRecordsProcessedInLark} records may have been processed by Lark.` });
        } else {
            console.error('[LOG] Handler: Quá trình đồng bộ thất bại ở một số lô.');
            return res.status(500).json({ success: false, message: 'Failed to send some data chunks to Lark Base.' });
        }
    } catch (e: any) {
        console.error("[LOG] Handler: LỖI KHÔNG XÁC ĐỊNH TRONG HANDLER:", e.message, e.stack, e);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred in the handler.', error: e.message });
    }
}