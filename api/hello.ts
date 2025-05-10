import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch'; // Cần cài đặt: npm install node-fetch@2 Hoặc dùng fetch có sẵn trong Node 18+

// --- CẤU HÌNH CẦN THAY ĐỔI ---
// Lưu trữ các giá trị này dưới dạng Environment Variables trên Vercel để bảo mật
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760e8cffc389029';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || '5DkLrc6xvHH50utrIkoE4dUDjGvBX0ei';
const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng



async function getLarkTenantAccessToken(): Promise<string | null> {
    console.log('[LOG] getLarkTenantAccessToken: Bắt đầu lấy token...');
    if (!LARK_APP_ID || !LARK_APP_SECRET) {
        console.error('[LOG] getLarkTenantAccessToken: LARK_APP_ID hoặc LARK_APP_SECRET chưa được cấu hình trong biến môi trường.');
        return null;
    }
    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
        });
        const responseText = await response.text();
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


// QUAN TRỌNG: BẠN PHẢI ĐIỀU CHỈNH HÀM NÀY CHO KHỚP VỚI BẢNG LARK BASE CỦA BẠN
// Hàm này nhận mảng dữ liệu gốc từ web demo (mỗi element là một mảng con)
function transformDataForLark(webDemoDataArray: any[]): Array<{ fields: Record<string, any> }> {
    console.log(`[LOG] transformDataForLark: Bắt đầu chuyển đổi ${webDemoDataArray ? webDemoDataArray.length : 0} bản ghi...`);
    if (!webDemoDataArray || !Array.isArray(webDemoDataArray) || webDemoDataArray.length === 0) {
        console.log('[LOG] transformDataForLark: Không có dữ liệu đầu vào hoặc không phải mảng.');
        return [];
    }

    const transformedRecords = webDemoDataArray.map((element, index) => {
        if (!Array.isArray(element)) {
            console.warn(`[LOG] transformDataForLark: Bỏ qua phần tử không phải mảng ở index ${index}:`, element);
            return null; // Bỏ qua phần tử này
        }

        // Dữ liệu từ web demo của bạn là một mảng các mảng.
        // element[0] là order_number, element[1] là platform, v.v.
        const checkInTimestamp = element[7];
        const checkOutTimestamp = element[8];
        const bookingTimestamp = element[6];
        const totalNightsCalculated = calculateTotalNights(checkInTimestamp, checkOutTimestamp);
        const priceValue = element[9];
        // const nightlyRateValue = (totalNightsCalculated !== '' && typeof totalNightsCalculated === 'number' && totalNightsCalculated > 0 && priceValue)
        //     ? (parseFloat(String(priceValue).replace(/,/g, '')) / totalNightsCalculated)
        //     : null;

        // ĐỐI TƯỢNG NÀY CẦN ĐƯỢC ÁNH XẠ ĐÚNG VỚI FIELD ID HOẶC TÊN CỘT TRONG LARK BASE
        // VÀ ĐÚNG KIỂU DỮ LIỆU CHO MỖI CỘT (Text, Number, Date, SingleSelect, User, etc.)
        const fieldsForLark: Record<string, any> = {
            // THAY THẾ "Tên Cột Trong Lark Base" hoặc "fldXXXXXXXX" bằng tên cột/Field ID thực tế của bạn
            "1.Order Code": String(element[0] || ''),       // Ví dụ: Order Number (Text)
           
        };

        // Log cấu trúc của một bản ghi đã transform để kiểm tra (chỉ log vài cái đầu)
        if (index < 2) {
             console.log(`[LOG] transformDataForLark: Ví dụ bản ghi thứ ${index + 1} đã transform:`, JSON.stringify({ fields: fieldsForLark }));
        }
        return { fields: fieldsForLark };
    }).filter(record => record !== null && record.fields && Object.keys(record.fields).length > 0);

    console.log(`[LOG] transformDataForLark: Chuyển đổi thành công ${transformedRecords.length} bản ghi.`);
    return transformedRecords;
}
// =====================================================================================

// Hàm gửi dữ liệu đến Lark Base (Giữ nguyên, nhưng có thể tối ưu log)
async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<{success: boolean, processedCount?: number, errorDetails?: any}> {
    console.log(`[LOG] sendDataToLarkBase: Bắt đầu gửi ${records.length} bản ghi...`);
    if (!records || records.length === 0) {
        console.log('[LOG] sendDataToLarkBase: Không có bản ghi nào để gửi.');
        return { success: true, processedCount: 0 };
    }
    if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
        console.error('[LOG] sendDataToLarkBase: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
        return { success: false, errorDetails: "LARK_BASE_APP_TOKEN or LARK_TABLE_ID not configured." };
    }

    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
    // console.log(`[LOG] sendDataToLarkBase: URL Lark Base API: ${url}`);
    // console.log('[LOG] sendDataToLarkBase: Dữ liệu gửi đi (ví dụ 1 bản ghi):', JSON.stringify(records.length > 0 ? { records: [records[0]] } : { records: [] }, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({ records }),
        });
        const responseText = await response.text();
        if (!response.ok) {
            console.error(`[LOG] sendDataToLarkBase: Lỗi HTTP từ API Lark Base: ${response.status}`, responseText);
            return { success: false, errorDetails: { status: response.status, text: responseText } };
        }
        try {
            const data: any = JSON.parse(responseText);
            if (data.code === 0) {
                const processed = data.data?.records?.length || 0;
                console.log(`[LOG] sendDataToLarkBase: Gửi dữ liệu đến Lark Base thành công: ${processed} bản ghi đã được xử lý.`);
                return { success: true, processedCount: processed };
            } else {
                console.error('[LOG] sendDataToLarkBase: Lỗi logic từ API Lark Base:', responseText);
                return { success: false, errorDetails: data };
            }
        } catch (jsonError) {
            console.error('[LOG] sendDataToLarkBase: Lỗi parse JSON từ Lark Base API:', jsonError, 'Dữ liệu text nhận được:', responseText);
            return { success: false, errorDetails: { parseError: jsonError.message, rawText: responseText } };
        }
    } catch (error) {
        console.error('[LOG] sendDataToLarkBase: Lỗi mạng hoặc lỗi khác:', error);
        return { success: false, errorDetails: error.message };
    }
}

// --- Helper functions (Giữ nguyên từ code trước, đảm bảo chúng có trong file này) ---
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
    if (checkinTimestamp === null || checkinTimestamp === undefined || checkoutTimestamp === null || checkoutTimestamp === undefined) return '';
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
    console.log('[LOG] Handler: Bắt đầu quá trình đồng bộ dữ liệu từ Web Demo POST...');

    // (Tùy chọn) Kiểm tra API Key nếu bạn cấu hình
    // const clientApiKey = req.headers['x-api-key'];
    // if (SERVERLESS_API_KEY && clientApiKey !== SERVERLESS_API_KEY) {
    //     console.warn('[LOG] Handler: Sai API Key hoặc không có API Key.');
    //     return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key' });
    // }

    if (req.method !== 'POST') {
        console.warn(`[LOG] Handler: Phương thức không hợp lệ: ${req.method}`);
        return res.status(405).json({ success: false, message: 'Method Not Allowed, please use POST.' });
    }

    // Dữ liệu JSON từ web demo sẽ nằm trong req.body
    // Vercel tự động parse JSON nếu Content-Type là application/json
    const webDemoPayload = req.body;
    if (!webDemoPayload || !webDemoPayload.rawOrderData) { // Giả sử web demo gửi { rawOrderData: [...] }
        console.error('[LOG] Handler: Dữ liệu không hợp lệ từ web demo. Thiếu "rawOrderData". Body:', webDemoPayload);
        return res.status(400).json({ success: false, message: 'Invalid payload from web demo. Expecting { "rawOrderData": [...] }.' });
    }

    const webDemoData = webDemoPayload.rawOrderData;

    if (!Array.isArray(webDemoData)) {
        console.error('[LOG] Handler: "rawOrderData" không phải là một mảng. Data:', webDemoData);
        return res.status(400).json({ success: false, message: '"rawOrderData" is not an array.' });
    }

    console.log(`[LOG] Handler: Nhận được ${webDemoData.length} bản ghi từ Web Demo qua POST request.`);

    if (webDemoData.length === 0) {
        console.log('[LOG] Handler: Không có dữ liệu từ Web Demo để đồng bộ.');
        return res.status(200).json({ success: true, message: 'No data from web demo to sync.' });
    }

    try {
        const larkAccessToken = await getLarkTenantAccessToken();
        if (!larkAccessToken) {
            console.error('[LOG] Handler: Không thể lấy Lark Access Token. Dừng quá trình.');
            return res.status(500).json({ success: false, message: 'Failed to get Lark access token. Check LARK_APP_ID and LARK_APP_SECRET environment variables.' });
        }
        console.log('[LOG] Handler: Đã lấy được Lark Access Token.');

        const recordsForLark = transformDataForLark(webDemoData);
        console.log(`[LOG] Handler: Đã chuyển đổi ${recordsForLark.length} bản ghi cho Lark.`);

        if (recordsForLark.length === 0 && webDemoData.length > 0) {
            console.warn('[LOG] Handler: Dữ liệu Web Demo có nhưng không chuyển đổi được bản ghi nào cho Lark (kiểm tra logic transformDataForLark và dữ liệu đầu vào).');
            return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark. Check mapping and input data. Ensure `element` inside webDemoData is an array.' });
        }
        if (recordsForLark.length === 0) {
            console.log('[LOG] Handler: Không có bản ghi hợp lệ nào sau khi chuyển đổi để gửi đến Lark.');
            return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
        }

        const CHUNK_SIZE = 450; // Giữ nguyên giới hạn API của Lark
        let allChunksSentSuccessfully = true;
        let totalRecordsSyncedToLark = 0;
        console.log(`[LOG] Handler: Tổng số bản ghi cần gửi: ${recordsForLark.length}. Chia thành các lô ${CHUNK_SIZE} bản ghi.`);

        for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE) {
            const chunk = recordsForLark.slice(i, i + CHUNK_SIZE);
            console.log(`[LOG] Handler: Đang xử lý lô từ index ${i} đến ${i + chunk.length - 1}, kích thước lô: ${chunk.length}`);
            const sendResult = await sendDataToLarkBase(larkAccessToken, chunk);

            if (sendResult.success) {
                totalRecordsSyncedToLark += sendResult.processedCount || chunk.length; // Ưu tiên số lượng từ Lark trả về
            } else {
                allChunksSentSuccessfully = false;
                console.error(`[LOG] Handler: Lỗi khi gửi lô dữ liệu từ index ${i}. Chi tiết lỗi:`, sendResult.errorDetails);
                // Bạn có thể quyết định dừng hoặc tiếp tục với các lô khác
                // break; // Dừng nếu một lô lỗi
            }
            // Thêm delay nếu cần thiết, đặc biệt nếu bạn không dừng khi có lỗi ở một chunk
            if (recordsForLark.length > CHUNK_SIZE && i + CHUNK_SIZE < recordsForLark.length) {
                console.log('[LOG] Handler: Đang tạm dừng 1 giây trước khi gửi lô tiếp theo...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (allChunksSentSuccessfully) {
            console.log(`[LOG] Handler: Quá trình đồng bộ hoàn tất. Tổng cộng ${totalRecordsSyncedToLark} bản ghi đã được xử lý bởi Lark.`);
            return res.status(200).json({ success: true, message: `Data sync completed. ${totalRecordsSyncedToLark} records processed by Lark.` });
        } else {
            console.error('[LOG] Handler: Quá trình đồng bộ có lỗi ở một số lô.');
            return res.status(500).json({ success: false, message: 'Failed to send some data chunks to Lark Base. Check logs for details.' });
        }
    } catch (e: any) {
        console.error("[LOG] Handler: LỖI KHÔNG XÁC ĐỊNH TRONG HANDLER:", e.message, e.stack, e);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred in the handler.', error: e.message });
    }
}