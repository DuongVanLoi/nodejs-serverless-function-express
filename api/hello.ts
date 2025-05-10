







// Đặt file này trong thư mục api của dự án Vercel, ví dụ: api/sync-to-lark.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch'; // yarn add node-fetch@2 hoặc npm install node-fetch@2

// --- CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL ---
// Lưu trữ các giá trị này dưới dạng Environment Variables trên Vercel để bảo mật
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760fa9069b85010';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'BMdZmUVSCztTo4o78CbkfgEXtN4RAbWo';
const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng
// const SERVERLESS_API_KEY = process.env.SERVERLESS_API_KEY; // Tùy chọn
// --- KẾT THÚC CẤU HÌNH ---

async function getLarkTenantAccessToken(): Promise<string | null> {
    console.log('[SLS_LOG] getLarkTenantAccessToken: Bắt đầu lấy token...');
    if (!LARK_APP_ID || !LARK_APP_SECRET) {
        console.error('[SLS_LOG] getLarkTenantAccessToken: LARK_APP_ID hoặc LARK_APP_SECRET chưa được cấu hình trong biến môi trường.');
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
            console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi HTTP từ API Lark Auth:', response.status, responseText);
            return null;
        }
        try {
            const data: any = JSON.parse(responseText);
            if (data.code === 0 && data.tenant_access_token) {
                console.log('[SLS_LOG] getLarkTenantAccessToken: Lấy Tenant Access Token thành công.');
                return data.tenant_access_token;
            } else {
                console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi logic từ API Lark Auth:', data);
                return null;
            }
        } catch (jsonError: any) {
            console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi parse JSON từ API Lark Auth:', jsonError.message, 'Dữ liệu text nhận được:', responseText);
            return null;
        }
    } catch (error: any) {
        console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi mạng hoặc lỗi khác:', error.message);
        return null;
    }
}

function transformDataForLark(webDemoDataArray: any[]): Array<{ fields: Record<string, any> }> {
    console.log(`[SLS_LOG] transformDataForLark: Bắt đầu chuyển đổi ${webDemoDataArray ? webDemoDataArray.length : 0} bản ghi...`);
    if (!webDemoDataArray || !Array.isArray(webDemoDataArray) || webDemoDataArray.length === 0) {
        console.log('[SLS_LOG] transformDataForLark: Không có dữ liệu đầu vào.');
        return [];
    }

    const transformedRecords = webDemoDataArray.map((element, index) => {
        if (!Array.isArray(element) || element.length < 13) { // Kiểm tra element là mảng và có đủ phần tử tối thiểu mong đợi
            console.warn(`[SLS_LOG] transformDataForLark: Bỏ qua phần tử không hợp lệ ở index ${index}:`, JSON.stringify(element).substring(0,100) + "...");
            return null;
        }

        const checkInTimestamp = element[7] ? Number(element[7]) : null;
        const checkOutTimestamp = element[8] ? Number(element[8]) : null;
        const bookingTimestamp = element[6] ? Number(element[6]) : null;
        const totalNightsCalculated = calculateTotalNights(checkInTimestamp, checkOutTimestamp);
        const priceRaw = element[9];
        const cancelFeeRaw = element[4];

        const fieldsForLark: Record<string, any> = {
            // --- THAY THẾ CÁC KEY DƯỚI ĐÂY BẰNG TÊN CỘT HOẶC FIELD ID TRONG LARK BASE CỦA BẠN ---
            // Đảm bảo kiểu dữ liệu phù hợp với cột trong Lark Base

            //"Plafform" : Number(element[1]),
            //"52. Order Number": String(element[0] || ''), // Giả sử đây là Tên Cột trong Lark Base
            //"Guest Name" : String(element[10] || ''),
             "Plafform": String(element[1] || ''),
            "52. Order Number": String(element[0] || ''),
            "Guest Name": String(element[10] || ''),
            "Check In" : String(getDay(element[7])),
            "Check Out" : String(getDay(element[8])),
            "Price" : formatCurrency(Number(priceRaw)),
            "Room Type": String(element[5] || ''),
            //"Status Order": String(element[12] ? element[12] : 'Confirmed'),
            //  "Platform": String(element[1] || ''),
            //  "Guest Name": String(element[10] || ''),
            //  "14Checking in Date auto": checkInTimestamp ? new Date(checkInTimestamp * 1000).getTime() : null,
            //  "24.Total Amount auto": priceRaw,
             //"Check Out": checkoutTimestamp ? new Date(checkoutTimestamp * 1000).getTime() : null,
            // "Total Nights": totalNightsCalculated === '' ? null : Number(totalNightsCalculated),
            // "Phone": String(element[2] || ''),
            // "Price (VND)": priceRaw != null ? parseFloat(String(priceRaw).replace(/,/g, '')) : null,
            // "Room Type": String(element[5] || ''),
            // "Status Order": String(element[12] ? element[12] : 'Confirmed'),
            // "Cancellation Fee (VND)": cancelFeeRaw != null ? parseFloat(String(cancelFeeRaw).replace(/,/g, '')) : null,
            // "Booking Time": bookingTimestamp ? new Date(bookingTimestamp * 1000).getTime() : null,
            // "Room ID": String(element[11] || ''),
            // "Price Per Night (VND)": /* tính toán nếu cần */,
            // --- KẾT THÚC PHẦN CẦN THAY THẾ ---
        };
        
        const cleanedFields: Record<string, any> = {};
        for (const key in fieldsForLark) {
            if (fieldsForLark[key] !== null && fieldsForLark[key] !== undefined) {
                if (typeof fieldsForLark[key] === 'string' && fieldsForLark[key].trim() === '' && !['Order Number', 'Platform', 'Guest Name', 'Phone', 'Room Type', 'Status Order', 'Room ID'].includes(key) ) {
                    // Có thể bỏ qua chuỗi rỗng cho các trường text không bắt buộc
                } else {
                    cleanedFields[key] = fieldsForLark[key];
                }
            }
        }
         if (Object.keys(cleanedFields).length === 0 && Object.keys(fieldsForLark).length > 0) {
            console.warn(`[SLS_LOG] transformDataForLark: Bản ghi ở index ${index} không có trường nào có giá trị sau khi làm sạch, nhưng có trường ban đầu.`);
            // Bạn có thể quyết định vẫn giữ lại bản ghi rỗng nếu muốn, hoặc bỏ qua như hiện tại
            // return { fields: {} }; // Nếu muốn gửi bản ghi rỗng để tạo dòng
         }
         if (Object.keys(cleanedFields).length === 0) return null;


        if (index < 2) {
             console.log(`[SLS_LOG] transformDataForLark: Ví dụ bản ghi ${index+1} đã transform:`, JSON.stringify({ fields: cleanedFields }));
        }
        return { fields: cleanedFields };

    }).filter(record => record !== null);

    console.log(`[SLS_LOG] transformDataForLark: Chuyển đổi thành công ${transformedRecords.length} bản ghi.`);
    return transformedRecords;
}

async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<{success: boolean, processedCount?: number, errorDetails?: any}> {
    console.log(`[SLS_LOG] sendDataToLarkBase: Bắt đầu gửi ${records.length} bản ghi...`);
    if (!records || records.length === 0) {
        console.log('[SLS_LOG] sendDataToLarkBase: Không có bản ghi nào để gửi.');
        return { success: true, processedCount: 0 };
    }
    if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
        console.error('[SLS_LOG] sendDataToLarkBase: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
        return { success: false, errorDetails: "LARK_BASE_APP_TOKEN or LARK_TABLE_ID not configured." };
    }

    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
    
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
            console.error(`[SLS_LOG] sendDataToLarkBase: Lỗi HTTP từ API Lark Base: ${response.status}`, responseText);
            return { success: false, errorDetails: { status: response.status, text: responseText } };
        }
        try {
            const data: any = JSON.parse(responseText);
            if (data.code === 0) {
                const processed = data.data?.records?.length || 0;
                console.log(`[SLS_LOG] sendDataToLarkBase: Gửi dữ liệu đến Lark Base thành công: ${processed} bản ghi đã được xử lý.`);
                return { success: true, processedCount: processed };
            } else {
                console.error('[SLS_LOG] sendDataToLarkBase: Lỗi logic từ API Lark Base:', data);
                return { success: false, errorDetails: data };
            }
        } catch (jsonError: any) {
            console.error('[SLS_LOG] sendDataToLarkBase: Lỗi parse JSON từ Lark Base API:', jsonError.message, 'Dữ liệu text nhận được:', responseText);
            return { success: false, errorDetails: { parseError: jsonError.message, rawText: responseText } };
        }
    } catch (error: any) {
        console.error('[SLS_LOG] sendDataToLarkBase: Lỗi mạng hoặc lỗi khác:', error.message);
        return { success: false, errorDetails: error.message };
    }
}

// function getDay(timestampInSeconds: number | null | undefined): string | null {
//     if (timestampInSeconds === null || timestampInSeconds === undefined || timestampInSeconds === 0) return null;
//     const numTimestamp = Number(timestampInSeconds);
//     if (isNaN(numTimestamp)) return null;
//     const date = new Date(numTimestamp * 1000);
//     if (isNaN(date.getTime())) return null;
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// }


function formatCurrency(value) {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const numberValue = parseFloat(String(value).replace(/,/g, ''));
        if (isNaN(numberValue)) {
            return String(value); 
        }
        try {
            return numberValue.toLocaleString('en-US', {
                 maximumFractionDigits: 0
            });
        } catch (e) {
            return String(numberValue); 
        }
    }


function getDay (timestampInSeconds) {
    if (!timestampInSeconds) return '';
    const date = new Date(timestampInSeconds * 1000);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateTotalNights(checkinTimestamp: number | null | undefined, checkoutTimestamp: number | null | undefined): number | '' {
    if (checkinTimestamp === null || checkinTimestamp === undefined || checkoutTimestamp === null || checkoutTimestamp === undefined) return '';
    const numCheckin = Number(checkinTimestamp);
    const numCheckout = Number(checkoutTimestamp);
    if (isNaN(numCheckin) || isNaN(numCheckout)) return '';

    try {
        const checkinDate = new Date(numCheckin * 1000);
        const checkoutDate = new Date(numCheckout * 1000);
        if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) return '';
        checkinDate.setHours(12, 0, 0, 0);
        checkoutDate.setHours(12, 0, 0, 0);
        const diffTime = checkoutDate.getTime() - checkinDate.getTime();
        if (diffTime < 0) {
            // console.warn("[SLS_LOG] calculateTotalNights: Ngày check-out trước ngày check-in.");
            return '';
        }
        const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffNights;
    } catch (e: any) {
        // console.error("[SLS_LOG] calculateTotalNights: Lỗi khi tính số đêm:", e.message);
        return '';
    }
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
    // --- THÊM HEADER CORS ---
    // Quan trọng: Trong production, hãy giới hạn origin cụ thể hơn là '*'
    const allowedOrigin = process.env.ALLOWED_CORS_ORIGIN || '*'; // Ví dụ: 'http://127.0.0.1:5500' hoặc domain web demo của bạn
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key'); // Thêm X-API-Key nếu bạn dùng

    // Xử lý preflight request
    if (req.method === 'OPTIONS') {
        console.log('[SLS_LOG] Handler: OPTIONS request received (preflight).');
        return res.status(200).end();
    }
    // --- KẾT THÚC HEADER CORS ---

    console.log('[SLS_LOG] Handler: Bắt đầu quá trình đồng bộ dữ liệu từ Web Demo POST...');
    console.log(`[SLS_LOG] Handler: LARK_APP_ID is set: ${!!process.env.LARK_APP_ID}`);
    console.log(`[SLS_LOG] Handler: LARK_BASE_APP_TOKEN is set: ${!!process.env.LARK_BASE_APP_TOKEN}`);
    console.log(`[SLS_LOG] Handler: LARK_TABLE_ID is set: ${!!process.env.LARK_TABLE_ID}`);

    // (Tùy chọn) Kiểm tra API Key
    // const clientApiKey = req.headers['x-api-key'] as string;
    // if (SERVERLESS_API_KEY && clientApiKey !== SERVERLESS_API_KEY) {
    //     console.warn('[SLS_LOG] Handler: Sai API Key hoặc không có API Key.');
    //     return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key' });
    // }

    if (req.method !== 'POST') {
        console.warn(`[SLS_LOG] Handler: Phương thức không hợp lệ: ${req.method}`);
        res.setHeader('Allow', ['POST', 'OPTIONS']); // Thông báo các method được phép
        return res.status(405).json({ success: false, message: 'Method Not Allowed, please use POST.' });
    }

    const webDemoPayload = req.body;
    if (!webDemoPayload || !webDemoPayload.rawOrderData) {
        console.error('[SLS_LOG] Handler: Dữ liệu không hợp lệ. Thiếu "rawOrderData". Body:', webDemoPayload);
        return res.status(400).json({ success: false, message: 'Invalid payload. Expecting { "rawOrderData": [...] }.' });
    }

    const webDemoData = webDemoPayload.rawOrderData;
    if (!Array.isArray(webDemoData)) {
        console.error('[SLS_LOG] Handler: "rawOrderData" không phải là mảng. Data:', webDemoData);
        return res.status(400).json({ success: false, message: '"rawOrderData" is not an array.' });
    }

    console.log(`[SLS_LOG] Handler: Nhận được ${webDemoData.length} bản ghi từ Web Demo.`);
    if (webDemoData.length === 0) {
        return res.status(200).json({ success: true, message: 'No data from web demo to sync.' });
    }

    try {
        const larkAccessToken = await getLarkTenantAccessToken();
        if (!larkAccessToken) {
            return res.status(500).json({ success: false, message: 'Failed to get Lark access token.' });
        }

        const recordsForLark = transformDataForLark(webDemoData);
        if (recordsForLark.length === 0 && webDemoData.length > 0) {
            return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark. Check mapping and input data structure.' });
        }
        if (recordsForLark.length === 0) {
            return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
        }

        const CHUNK_SIZE = 450;
        let allChunksSentSuccessfully = true;
        let totalRecordsSyncedToLark = 0;

        for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE) {
            const chunk = recordsForLark.slice(i, i + CHUNK_SIZE);
            console.log(`[SLS_LOG] Handler: Đang gửi lô ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(recordsForLark.length / CHUNK_SIZE)}, kích thước: ${chunk.length}`);
            const sendResult = await sendDataToLarkBase(larkAccessToken, chunk);

            if (sendResult.success) {
                totalRecordsSyncedToLark += sendResult.processedCount !== undefined ? sendResult.processedCount : chunk.length;
            } else {
                allChunksSentSuccessfully = false;
                console.error(`[SLS_LOG] Handler: Lỗi khi gửi lô dữ liệu. Chi tiết:`, sendResult.errorDetails);
            }
            if (recordsForLark.length > CHUNK_SIZE && i + CHUNK_SIZE < recordsForLark.length && allChunksSentSuccessfully) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (allChunksSentSuccessfully) {
            return res.status(200).json({ success: true, message: `Data sync potentially completed. ${totalRecordsSyncedToLark} records processed by Lark.` });
        } else {
            return res.status(207).json({ success: false, message: `Data sync partially failed. ${totalRecordsSyncedToLark} records may have been processed. Check logs for details.` });
        }
    } catch (e: any) {
        console.error("[SLS_LOG] Handler: LỖI KHÔNG XÁC ĐỊNH:", e.message, e.stack);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred.', error: e.message });
    }
}








// // Đặt file này trong thư mục api của dự án Vercel, ví dụ: api/sync-to-lark.ts
// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import fetch from 'node-fetch'; // yarn add node-fetch@2 hoặc npm install node-fetch@2

// // --- CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL ---
// const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760fa9069b85010';
// const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'BMdZmUVSCztTo4o78CbkfgEXtN4RAbWo';
// const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
// const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng
// //const ALLOWED_CORS_ORIGIN = process.env.ALLOWED_CORS_ORIGIN || '*'; // Đặt thành domain web demo của bạn trong production
// // --- KẾT THÚC CẤU HÌNH ---

// async function getLarkTenantAccessToken(): Promise<string | null> {
//     console.log('[SLS_LOG] getLarkTenantAccessToken: Bắt đầu lấy token...');
//     if (!LARK_APP_ID || !LARK_APP_SECRET) {
//         console.error('[SLS_LOG] getLarkTenantAccessToken: LARK_APP_ID hoặc LARK_APP_SECRET chưa được cấu hình.');
//         return null;
//     }
//     try {
//         const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json; charset=utf-8' },
//             body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
//         });
//         const responseText = await response.text();
//         if (!response.ok) {
//             console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi HTTP từ API Lark Auth:', response.status, responseText);
//             return null;
//         }
//         try {
//             const data: any = JSON.parse(responseText);
//             if (data.code === 0 && data.tenant_access_token) {
//                 console.log('[SLS_LOG] getLarkTenantAccessToken: Lấy Tenant Access Token thành công.');
//                 return data.tenant_access_token;
//             } else {
//                 console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi logic từ API Lark Auth:', data);
//                 return null;
//             }
//         } catch (jsonError: any) {
//             console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi parse JSON từ API Lark Auth:', jsonError.message, 'Dữ liệu text:', responseText);
//             return null;
//         }
//     } catch (error: any) {
//         console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi mạng hoặc lỗi khác:', error.message);
//         return null;
//     }
// }

// async function getAllRecordIds(accessToken: string): Promise<string[] | null> {
//     console.log('[SLS_LOG] getAllRecordIds: Bắt đầu lấy tất cả record_ids...');
//     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
//         console.error('[SLS_LOG] getAllRecordIds: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
//         return null;
//     }

//     let allRecordIds: string[] = [];
//     let pageToken: string | undefined = undefined;
//     let hasMore = true;
//     const listRecordsUrlBase = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records`;

//     try {
//         while (hasMore) {
//             let url = listRecordsUrlBase;
//             const queryParams = new URLSearchParams();
//             if (pageToken) {
//                 queryParams.append('page_token', pageToken);
//             }
//             // Chỉ lấy trường record_id để giảm tải dữ liệu và tránh lỗi thiếu quyền field nếu chỉ cần ID
//             queryParams.append('field_names', '[]'); // Yêu cầu không lấy trường nào cụ thể, record_id sẽ tự có
//             queryParams.append('automatic_fields', 'false'); // Không lấy các trường tự động của Lark

//             url += `?${queryParams.toString()}`;

//             console.log(`[SLS_LOG] getAllRecordIds: Fetching page: ${url}`);
//             const response = await fetch(url, {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json; charset=utf-8',
//                 },
//             });
//             const responseText = await response.text();
//             if (!response.ok) {
//                 console.error(`[SLS_LOG] getAllRecordIds: Lỗi HTTP khi lấy danh sách bản ghi: ${response.status}`, responseText);
//                 return null;
//             }
//             const data: any = JSON.parse(responseText);
//             if (data.code === 0 && data.data && data.data.items) {
//                 data.data.items.forEach((item: any) => {
//                     if (item.record_id) {
//                         allRecordIds.push(item.record_id);
//                     }
//                 });
//                 hasMore = data.data.has_more;
//                 pageToken = data.data.page_token;
//                 console.log(`[SLS_LOG] getAllRecordIds: Lấy được ${data.data.items.length} record_ids. Has more: ${hasMore}. Total so far: ${allRecordIds.length}`);
//             } else {
//                 console.error('[SLS_LOG] getAllRecordIds: Lỗi logic từ API List Records:', data);
//                 return null;
//             }
//         }
//         console.log(`[SLS_LOG] getAllRecordIds: Lấy thành công tổng cộng ${allRecordIds.length} record_ids.`);
//         return allRecordIds;
//     } catch (error: any) {
//         console.error('[SLS_LOG] getAllRecordIds: Lỗi mạng hoặc lỗi khác:', error.message);
//         return null;
//     }
// }

// async function deleteRecordsInBatches(accessToken: string, recordIds: string[]): Promise<boolean> {
//     if (!recordIds || recordIds.length === 0) {
//         console.log('[SLS_LOG] deleteRecordsInBatches: Không có record_id nào để xóa.');
//         return true;
//     }
//     console.log(`[SLS_LOG] deleteRecordsInBatches: Bắt đầu xóa ${recordIds.length} bản ghi...`);
//     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
//         console.error('[SLS_LOG] deleteRecordsInBatches: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
//         return false;
//     }

//     const batchDeleteUrl = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_delete`;
//     const CHUNK_SIZE_DELETE = 500;
//     let allChunksDeletedSuccessfully = true;

//     for (let i = 0; i < recordIds.length; i += CHUNK_SIZE_DELETE) {
//         const chunk = recordIds.slice(i, i + CHUNK_SIZE_DELETE);
//         console.log(`[SLS_LOG] deleteRecordsInBatches: Đang xóa lô ${Math.floor(i / CHUNK_SIZE_DELETE) + 1}, kích thước: ${chunk.length}`);
//         try {
//             const response = await fetch(batchDeleteUrl, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json; charset=utf-8',
//                 },
//                 body: JSON.stringify({ records: chunk }),
//             });
//             const responseText = await response.text();
//             if (!response.ok) {
//                 console.error(`[SLS_LOG] deleteRecordsInBatches: Lỗi HTTP khi xóa lô bản ghi: ${response.status}`, responseText);
//                 allChunksDeletedSuccessfully = false;
//             } else {
//                 const data: any = JSON.parse(responseText);
//                 if (data.code === 0) {
//                     const failedCount = data.data?.failed_records?.length || 0;
//                     console.log(`[SLS_LOG] deleteRecordsInBatches: Xóa lô thành công. Records failed: ${failedCount}`);
//                     if (failedCount > 0) {
//                         allChunksDeletedSuccessfully = false;
//                         console.warn('[SLS_LOG] deleteRecordsInBatches: Một số bản ghi trong lô không xóa được:', data.data.failed_records);
//                     }
//                 } else {
//                     console.error('[SLS_LOG] deleteRecordsInBatches: Lỗi logic từ API Batch Delete:', data);
//                     allChunksDeletedSuccessfully = false;
//                 }
//             }
//         } catch (error: any) {
//             console.error('[SLS_LOG] deleteRecordsInBatches: Lỗi mạng hoặc lỗi khác khi xóa lô:', error.message);
//             allChunksDeletedSuccessfully = false;
//         }
//         if (recordIds.length > CHUNK_SIZE_DELETE && i + CHUNK_SIZE_DELETE < recordIds.length && allChunksDeletedSuccessfully) {
//             await new Promise(resolve => setTimeout(resolve, 1000)); // Delay giữa các lô xóa
//         }
//     }
//     return allChunksDeletedSuccessfully;
// }

// // =====================================================================================
// // HÀM NÀY BẠN PHẢI TÙY CHỈNH CHO KHỚP VỚI DỮ LIỆU WEB DEMO VÀ BẢNG LARK BASE
// function transformDataForLark(webDemoDataArray: any[]): Array<{ fields: Record<string, any> }> {
//     console.log(`[SLS_LOG] transformDataForLark: Bắt đầu chuyển đổi ${webDemoDataArray ? webDemoDataArray.length : 0} bản ghi...`);
//     if (!webDemoDataArray || !Array.isArray(webDemoDataArray) || webDemoDataArray.length === 0) {
//         return [];
//     }

//     const transformedRecords = webDemoDataArray.map((element, index) => {
//         // Kiểm tra cơ bản cấu trúc element (là mảng và có đủ phần tử tối thiểu bạn cần)
//         if (!Array.isArray(element) || element.length < 13) { // Ví dụ: cần ít nhất 13 phần tử để lấy element[12]
//             console.warn(`[SLS_LOG] transformDataForLark: Bỏ qua phần tử không hợp lệ ở index ${index}:`, JSON.stringify(element).substring(0,100)+"...");
//             return null;
//         }
//         const checkInTimestamp = element[7] ? Number(element[7]) : null;
//         const checkOutTimestamp = element[8] ? Number(element[8]) : null;
//         const bookingTimestamp = element[6] ? Number(element[6]) : null;
//         const totalNightsCalculated = calculateTotalNights(checkInTimestamp, checkOutTimestamp);
//         const priceRaw = element[9];
//         const cancelFeeRaw = element[4];

//         const fieldsForLark: Record<string, any> = {
//             // --- THAY THẾ CÁC KEY DƯỚI ĐÂY BẰNG TÊN CỘT HOẶC FIELD ID TRONG LARK BASE CỦA BẠN ---
//             // Đảm bảo kiểu dữ liệu phù hợp với cột trong Lark Base

//             //"Plafform" : Number(element[1]),
//             //"52. Order Number": String(element[0] || ''), // Giả sử đây là Tên Cột trong Lark Base
//             //"Guest Name" : String(element[10] || ''),
//              "Plafform": String(element[1] || ''),
//             "52. Order Number": String(element[0] || ''),
//             "Guest Name": String(element[10] || ''),
//             //  "Platform": String(element[1] || ''),
//             //  "Guest Name": String(element[10] || ''),
//             //  "14Checking in Date auto": checkInTimestamp ? new Date(checkInTimestamp * 1000).getTime() : null,
//             //  "24.Total Amount auto": priceRaw,
//              //"Check Out": checkoutTimestamp ? new Date(checkoutTimestamp * 1000).getTime() : null,
//             // "Total Nights": totalNightsCalculated === '' ? null : Number(totalNightsCalculated),
//             // "Phone": String(element[2] || ''),
//             // "Price (VND)": priceRaw != null ? parseFloat(String(priceRaw).replace(/,/g, '')) : null,
//             // "Room Type": String(element[5] || ''),
//             // "Status Order": String(element[12] ? element[12] : 'Confirmed'),
//             // "Cancellation Fee (VND)": cancelFeeRaw != null ? parseFloat(String(cancelFeeRaw).replace(/,/g, '')) : null,
//             // "Booking Time": bookingTimestamp ? new Date(bookingTimestamp * 1000).getTime() : null,
//             // "Room ID": String(element[11] || ''),
//             // "Price Per Night (VND)": /* tính toán nếu cần */,
//             // --- KẾT THÚC PHẦN CẦN THAY THẾ ---
//         };
        
//         const cleanedFields: Record<string, any> = {};
//         for (const key in fieldsForLark) {
//             if (fieldsForLark[key] !== null && fieldsForLark[key] !== undefined) {
//                 cleanedFields[key] = fieldsForLark[key];
//             }
//         }
//         if (Object.keys(cleanedFields).length === 0) {
//             console.warn(`[SLS_LOG] transformDataForLark: Bản ghi ở index ${index} rỗng sau khi làm sạch.`);
//             return null;
//         }

//         if (index < 2) {
//              console.log(`[SLS_LOG] transformDataForLark: Ví dụ bản ghi ${index+1} đã transform:`, JSON.stringify({ fields: cleanedFields }));
//         }
//         return { fields: cleanedFields };

//     }).filter(record => record !== null);

//     console.log(`[SLS_LOG] transformDataForLark: Chuyển đổi thành công ${transformedRecords.length} bản ghi.`);
//     return transformedRecords;
// }
// // =====================================================================================

// async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<{success: boolean, processedCount?: number, errorDetails?: any}> {
//     // ... (Hàm sendDataToLarkBase giữ nguyên như ở câu trả lời trước)
//     console.log(`[SLS_LOG] sendDataToLarkBase: Bắt đầu gửi ${records.length} bản ghi...`);
//     if (!records || records.length === 0) {
//         return { success: true, processedCount: 0 };
//     }
//     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
//         return { success: false, errorDetails: "LARK_BASE_APP_TOKEN or LARK_TABLE_ID not configured." };
//     }
//     const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=utf-8' },
//             body: JSON.stringify({ records }),
//         });
//         const responseText = await response.text();
//         if (!response.ok) {
//             return { success: false, errorDetails: { status: response.status, text: responseText } };
//         }
//         const data: any = JSON.parse(responseText);
//         if (data.code === 0) {
//             return { success: true, processedCount: data.data?.records?.length || 0 };
//         } else {
//             return { success: false, errorDetails: data };
//         }
//     } catch (error: any) {
//         return { success: false, errorDetails: error.message };
//     }
// }

// // --- Helper functions ---
// function getDay(timestampInSeconds: number | null | undefined): string | null {
//     if (timestampInSeconds === null || timestampInSeconds === undefined || timestampInSeconds === 0) return null;
//     const numTimestamp = Number(timestampInSeconds);
//     if (isNaN(numTimestamp)) return null;
//     const date = new Date(numTimestamp * 1000);
//     if (isNaN(date.getTime())) return null;
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// }

// function calculateTotalNights(checkinTimestamp: number | null | undefined, checkoutTimestamp: number | null | undefined): number | '' {
//     if (checkinTimestamp === null || checkinTimestamp === undefined || checkoutTimestamp === null || checkoutTimestamp === undefined) return '';
//     const numCheckin = Number(checkinTimestamp);
//     const numCheckout = Number(checkoutTimestamp);
//     if (isNaN(numCheckin) || isNaN(numCheckout)) return '';
//     try {
//         const checkinDate = new Date(numCheckin * 1000);
//         const checkoutDate = new Date(numCheckout * 1000);
//         if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) return '';
//         checkinDate.setHours(12, 0, 0, 0);
//         checkoutDate.setHours(12, 0, 0, 0);
//         const diffTime = checkoutDate.getTime() - checkinDate.getTime();
//         if (diffTime < 0) return '';
//         const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
//         return diffNights;
//     } catch (e: any) { return ''; }
// }

// // --- Main Handler ---
// export default async function handler(req: VercelRequest, res: VercelResponse) {
//     res.setHeader('Access-Control-Allow-Origin', ALLOWED_CORS_ORIGIN);
//     res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
//     if (req.method === 'OPTIONS') {
//         console.log('[SLS_LOG] Handler: OPTIONS request (preflight).');
//         return res.status(200).end();
//     }

//     console.log('[SLS_LOG] Handler: Bắt đầu XÓA và ĐỒNG BỘ dữ liệu...');
//     if (req.method !== 'POST') {
//         res.setHeader('Allow', ['POST', 'OPTIONS']);
//         return res.status(405).json({ success: false, message: 'Method Not Allowed.' });
//     }

//     const webDemoPayload = req.body;
//     if (!webDemoPayload || !webDemoPayload.rawOrderData || !Array.isArray(webDemoPayload.rawOrderData)) {
//         return res.status(400).json({ success: false, message: 'Invalid payload. Expecting { "rawOrderData": [...] }.' });
//     }
//     const webDemoData = webDemoPayload.rawOrderData;
//     console.log(`[SLS_LOG] Handler: Nhận được ${webDemoData.length} bản ghi từ Web Demo.`);

//     try {
//         const larkAccessToken = await getLarkTenantAccessToken();
//         if (!larkAccessToken) {
//             return res.status(500).json({ success: false, message: 'Failed to get Lark access token.' });
//         }
//         console.log('[SLS_LOG] Handler: Đã lấy Lark Access Token.');

//         // --- XÓA BẢN GHI CŨ ---
//         const oldRecordIds = await getAllRecordIds(larkAccessToken);
//         if (oldRecordIds === null) {
//             console.error('[SLS_LOG] Handler: Không thể lấy old record IDs. Dừng lại.');
//             return res.status(500).json({ success: false, message: 'Failed to retrieve old record IDs to delete.' });
//         }
//         if (oldRecordIds.length > 0) {
//             console.log(`[SLS_LOG] Handler: Tìm thấy ${oldRecordIds.length} bản ghi cũ, bắt đầu xóa...`);
//             const deleteSuccess = await deleteRecordsInBatches(larkAccessToken, oldRecordIds);
//             if (!deleteSuccess) {
//                 console.warn('[SLS_LOG] Handler: Có lỗi khi xóa một số bản ghi cũ.');
//                 // Bạn có thể quyết định dừng ở đây nếu việc xóa là bắt buộc phải thành công 100%
//                 // return res.status(500).json({ success: false, message: 'Failed to delete all old records.' });
//             } else {
//                 console.log('[SLS_LOG] Handler: Hoàn tất việc cố gắng xóa bản ghi cũ.');
//             }
//         } else {
//             console.log('[SLS_LOG] Handler: Không có bản ghi cũ nào trong bảng để xóa.');
//         }
//         // --- KẾT THÚC XÓA ---

//         if (webDemoData.length === 0) {
//             return res.status(200).json({ success: true, message: 'No new data from web demo to sync. Old data (if any) processed for deletion.' });
//         }

//         const recordsForLark = transformDataForLark(webDemoData);
//         if (recordsForLark.length === 0 && webDemoData.length > 0) {
//             return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark. Check mapping/data structure.' });
//         }
//         if (recordsForLark.length === 0) {
//             return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
//         }

//         const CHUNK_SIZE_CREATE = 450;
//         let allNewChunksSentSuccessfully = true;
//         let totalNewRecordsSyncedToLark = 0;

//         for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE_CREATE) {
//             const chunk = recordsForLark.slice(i, i + CHUNK_SIZE_CREATE);
//             console.log(`[SLS_LOG] Handler: Đang gửi lô bản ghi MỚI ${Math.floor(i/CHUNK_SIZE_CREATE)+1}, kích thước: ${chunk.length}`);
//             const sendResult = await sendDataToLarkBase(larkAccessToken, chunk);
//             if (sendResult.success) {
//                 totalNewRecordsSyncedToLark += sendResult.processedCount !== undefined ? sendResult.processedCount : chunk.length;
//             } else {
//                 allNewChunksSentSuccessfully = false;
//                 console.error(`[SLS_LOG] Handler: Lỗi gửi lô bản ghi MỚI. Chi tiết:`, sendResult.errorDetails);
//             }
//             if (recordsForLark.length > CHUNK_SIZE_CREATE && i + CHUNK_SIZE_CREATE < recordsForLark.length && allNewChunksSentSuccessfully) {
//                 await new Promise(resolve => setTimeout(resolve, 1000));
//             }
//         }

//         if (allNewChunksSentSuccessfully) {
//             return res.status(200).json({ success: true, message: `Data sync completed. ${totalNewRecordsSyncedToLark} new records processed by Lark.` });
//         } else {
//             return res.status(207).json({ success: false, message: `New data sync partially failed. ${totalNewRecordsSyncedToLark} records may have been processed. Check logs.` });
//         }
//     } catch (e: any) {
//         console.error("[SLS_LOG] Handler: LỖI KHÔNG XÁC ĐỊNH:", e.message, e.stack);
//         return res.status(500).json({ success: false, message: 'An unexpected server error occurred.', error: e.message });
//     }
// }