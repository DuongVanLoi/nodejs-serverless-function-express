// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import fetch from 'node-fetch'; // yarn add node-fetch@2 hoặc npm install node-fetch@2

// // --- CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL ---

// const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760fa9069b85010';
// const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'BMdZmUVSCztTo4o78CbkfgEXtN4RAbWo';
// const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
// const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng
// // --- KẾT THÚC CẤU HÌNH ---

// async function getLarkTenantAccessToken(): Promise<string | null> {
//     console.log('[SLS_LOG] getLarkTenantAccessToken: Bắt đầu lấy token...');
//     if (!LARK_APP_ID || !LARK_APP_SECRET) {
//         console.error('[SLS_LOG] getLarkTenantAccessToken: LARK_APP_ID hoặc LARK_APP_SECRET chưa được cấu hình trong biến môi trường.');
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
//             console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi parse JSON từ API Lark Auth:', jsonError.message, 'Dữ liệu text nhận được:', responseText);
//             return null;
//         }
//     } catch (error: any) {
//         console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi mạng hoặc lỗi khác:', error.message);
//         return null;
//     }
// }

// function transformDataForLark(webDemoDataArray: any[]): Array<{ fields: Record<string, any> }> {
//     console.log(`[SLS_LOG] transformDataForLark: Bắt đầu chuyển đổi ${webDemoDataArray ? webDemoDataArray.length : 0} bản ghi...`);
//     if (!webDemoDataArray || !Array.isArray(webDemoDataArray) || webDemoDataArray.length === 0) {
//         console.log('[SLS_LOG] transformDataForLark: Không có dữ liệu đầu vào.');
//         return [];
//     }

//     const transformedRecords = webDemoDataArray.map((element, index) => {
//         if (!Array.isArray(element) || element.length < 13) { // Kiểm tra element là mảng và có đủ phần tử tối thiểu mong đợi
//             console.warn(`[SLS_LOG] transformDataForLark: Bỏ qua phần tử không hợp lệ ở index ${index}:`, JSON.stringify(element).substring(0,100) + "...");
//             return null;
//         }

//         const cancelFeeRaw = element[4];
//         const priceRaw = element[9];
//         const totalnight = calculateTotalNights(element[7], element[8]);
//         const pricenight = formatCurrency(priceRaw/Number(totalnight));

//         const fieldsForLark: Record<string, any> = {

//              "Plafform": String(element[1] || ''),
//             "52. Order Number": String(element[0] || ''),
//             "Guest Name": String(element[10] || ''),
//             "Check In" : String(getDay(element[7])),
//             "Check Out" : String(getDay(element[8])),
//             "Price" : formatCurrency(Number(priceRaw)),
//             "Room Type": String(element[5] || ''),
//             "Status Order": String(element[12] ? element[12] : 'Confirmed'),
//             "Cancellation Fee": formatCurrency(Number(cancelFeeRaw)),
//             "Booking Time" :String(getDay(element[6])),
//             "RoomID" : String(element[11] || ''),
//             "Phone": String(element[2] || ''),
//             "Total Night": String(totalnight),
//             "Price One Night": String(pricenight),

//         };
        
//         const cleanedFields: Record<string, any> = {};
//         for (const key in fieldsForLark) {
//             if (fieldsForLark[key] !== null && fieldsForLark[key] !== undefined) {
//                 if (typeof fieldsForLark[key] === 'string' && fieldsForLark[key].trim() === '' && !['Order Number', 'Platform', 'Guest Name', 'Phone', 'Room Type', 'Status Order', 'Room ID'].includes(key) ) {
//                     // Có thể bỏ qua chuỗi rỗng cho các trường text không bắt buộc
//                 } else {
//                     cleanedFields[key] = fieldsForLark[key];
//                 }
//             }
//         }
//          if (Object.keys(cleanedFields).length === 0 && Object.keys(fieldsForLark).length > 0) {
//             console.warn(`[SLS_LOG] transformDataForLark: Bản ghi ở index ${index} không có trường nào có giá trị sau khi làm sạch, nhưng có trường ban đầu.`);

//          }
//          if (Object.keys(cleanedFields).length === 0) return null;


//         if (index < 2) {
//              console.log(`[SLS_LOG] transformDataForLark: Ví dụ bản ghi ${index+1} đã transform:`, JSON.stringify({ fields: cleanedFields }));
//         }
//         return { fields: cleanedFields };

//     }).filter(record => record !== null);

//     console.log(`[SLS_LOG] transformDataForLark: Chuyển đổi thành công ${transformedRecords.length} bản ghi.`);
//     return transformedRecords;
// }

// async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<{success: boolean, processedCount?: number, errorDetails?: any}> {
//     console.log(`[SLS_LOG] sendDataToLarkBase: Bắt đầu gửi ${records.length} bản ghi...`);
//     if (!records || records.length === 0) {
//         console.log('[SLS_LOG] sendDataToLarkBase: Không có bản ghi nào để gửi.');
//         return { success: true, processedCount: 0 };
//     }
//     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
//         console.error('[SLS_LOG] sendDataToLarkBase: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
//         return { success: false, errorDetails: "LARK_BASE_APP_TOKEN or LARK_TABLE_ID not configured." };
//     }

//     const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
    
//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json; charset=utf-8',
//             },
//             body: JSON.stringify({ records }),
//         });
//         const responseText = await response.text();
//         if (!response.ok) {
//             console.error(`[SLS_LOG] sendDataToLarkBase: Lỗi HTTP từ API Lark Base: ${response.status}`, responseText);
//             return { success: false, errorDetails: { status: response.status, text: responseText } };
//         }
//         try {
//             const data: any = JSON.parse(responseText);
//             if (data.code === 0) {
//                 const processed = data.data?.records?.length || 0;
//                 console.log(`[SLS_LOG] sendDataToLarkBase: Gửi dữ liệu đến Lark Base thành công: ${processed} bản ghi đã được xử lý.`);
//                 return { success: true, processedCount: processed };
//             } else {
//                 console.error('[SLS_LOG] sendDataToLarkBase: Lỗi logic từ API Lark Base:', data);
//                 return { success: false, errorDetails: data };
//             }
//         } catch (jsonError: any) {
//             console.error('[SLS_LOG] sendDataToLarkBase: Lỗi parse JSON từ Lark Base API:', jsonError.message, 'Dữ liệu text nhận được:', responseText);
//             return { success: false, errorDetails: { parseError: jsonError.message, rawText: responseText } };
//         }
//     } catch (error: any) {
//         console.error('[SLS_LOG] sendDataToLarkBase: Lỗi mạng hoặc lỗi khác:', error.message);
//         return { success: false, errorDetails: error.message };
//     }
// }

// // function getDay(timestampInSeconds: number | null | undefined): string | null {
// //     if (timestampInSeconds === null || timestampInSeconds === undefined || timestampInSeconds === 0) return null;
// //     const numTimestamp = Number(timestampInSeconds);
// //     if (isNaN(numTimestamp)) return null;
// //     const date = new Date(numTimestamp * 1000);
// //     if (isNaN(date.getTime())) return null;
// //     const year = date.getFullYear();
// //     const month = String(date.getMonth() + 1).padStart(2, '0');
// //     const day = String(date.getDate()).padStart(2, '0');
// //     return `${year}-${month}-${day}`;
// // }


// function formatCurrency(value) {
//         if (value === null || value === undefined || value === '') {
//             return '';
//         }
//         const numberValue = parseFloat(String(value).replace(/,/g, ''));
//         if (isNaN(numberValue)) {
//             return String(value); 
//         }
//         try {
//             return numberValue.toLocaleString('en-US', {
//                  maximumFractionDigits: 0
//             });
//         } catch (e) {
//             return String(numberValue); 
//         }
//     }


// function getDay (timestampInSeconds) {
//     if (!timestampInSeconds) return '';
//     const date = new Date(timestampInSeconds * 1000);
//     if (isNaN(date.getTime())) return '';
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// }

// // function calculateTotalNights(checkinTimestamp){
// //     if (checkinTimestamp === null || checkinTimestamp === undefined || checkoutTimestamp === null || checkoutTimestamp === undefined) return '';
// //     const numCheckin = Number(checkinTimestamp);
// //     const numCheckout = Number(checkoutTimestamp);
// //     if (isNaN(numCheckin) || isNaN(numCheckout)) return '';

// //     try {
// //         const checkinDate = new Date(numCheckin * 1000);
// //         const checkoutDate = new Date(numCheckout * 1000);
// //         if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) return '';
// //         checkinDate.setHours(12, 0, 0, 0);
// //         checkoutDate.setHours(12, 0, 0, 0);
// //         const diffTime = checkoutDate.getTime() - checkinDate.getTime();
// //         if (diffTime < 0) {
// //             // console.warn("[SLS_LOG] calculateTotalNights: Ngày check-out trước ngày check-in.");
// //             return '';
// //         }
// //         const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
// //         return diffNights;
// //     } catch (e: any) {
// //         // console.error("[SLS_LOG] calculateTotalNights: Lỗi khi tính số đêm:", e.message);
// //         return '';
// //     }
// // }


// function calculateTotalNights(checkinTimestamp, checkoutTimestamp) {
//       if (!checkinTimestamp || !checkoutTimestamp) {
//         return '';
//       }
//       try {
//         const checkinDate = new Date(checkinTimestamp * 1000);
//         const checkoutDate = new Date(checkoutTimestamp * 1000);

//         if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
//            // console.warn("Invalid date for night calculation:", checkinTimestamp, checkoutTimestamp);
//            return '';
//         }
//         // Đặt giờ về trưa để tránh lỗi lệch múi giờ khi tính ngày
//         checkinDate.setHours(12, 0, 0, 0);
//         checkoutDate.setHours(12, 0, 0, 0);
//         const diffTime = checkoutDate.getTime() - checkinDate.getTime();
//         if (diffTime < 0) return ''; // Ngày check-out trước ngày check-in
//         const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
//         return diffNights; // Sẽ trả về 0 nếu cùng ngày
//       } catch (e) {
//         // console.error("Error calculating nights:", e);
//         return '';
//       }
// }


// export default async function handler(req: VercelRequest, res: VercelResponse) {
//     // --- THÊM HEADER CORS ---
//     // Quan trọng: Trong production, hãy giới hạn origin cụ thể hơn là '*'
//     const allowedOrigin = process.env.ALLOWED_CORS_ORIGIN || '*'; // Ví dụ: 'http://127.0.0.1:5500' hoặc domain web demo của bạn
//     res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
//     res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key'); // Thêm X-API-Key nếu bạn dùng

//     // Xử lý preflight request
//     if (req.method === 'OPTIONS') {
//         console.log('[SLS_LOG] Handler: OPTIONS request received (preflight).');
//         return res.status(200).end();
//     }
//     // --- KẾT THÚC HEADER CORS ---

//     console.log('[SLS_LOG] Handler: Bắt đầu quá trình đồng bộ dữ liệu từ Web Demo POST...');
//     console.log(`[SLS_LOG] Handler: LARK_APP_ID is set: ${!!process.env.LARK_APP_ID}`);
//     console.log(`[SLS_LOG] Handler: LARK_BASE_APP_TOKEN is set: ${!!process.env.LARK_BASE_APP_TOKEN}`);
//     console.log(`[SLS_LOG] Handler: LARK_TABLE_ID is set: ${!!process.env.LARK_TABLE_ID}`);

//     // (Tùy chọn) Kiểm tra API Key
//     // const clientApiKey = req.headers['x-api-key'] as string;
//     // if (SERVERLESS_API_KEY && clientApiKey !== SERVERLESS_API_KEY) {
//     //     console.warn('[SLS_LOG] Handler: Sai API Key hoặc không có API Key.');
//     //     return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key' });
//     // }

//     if (req.method !== 'POST') {
//         console.warn(`[SLS_LOG] Handler: Phương thức không hợp lệ: ${req.method}`);
//         res.setHeader('Allow', ['POST', 'OPTIONS']); // Thông báo các method được phép
//         return res.status(405).json({ success: false, message: 'Method Not Allowed, please use POST.' });
//     }

//     const webDemoPayload = req.body;
//     if (!webDemoPayload || !webDemoPayload.rawOrderData) {
//         console.error('[SLS_LOG] Handler: Dữ liệu không hợp lệ. Thiếu "rawOrderData". Body:', webDemoPayload);
//         return res.status(400).json({ success: false, message: 'Invalid payload. Expecting { "rawOrderData": [...] }.' });
//     }

//     const webDemoData = webDemoPayload.rawOrderData;
//     if (!Array.isArray(webDemoData)) {
//         console.error('[SLS_LOG] Handler: "rawOrderData" không phải là mảng. Data:', webDemoData);
//         return res.status(400).json({ success: false, message: '"rawOrderData" is not an array.' });
//     }

//     console.log(`[SLS_LOG] Handler: Nhận được ${webDemoData.length} bản ghi từ Web Demo.`);
//     if (webDemoData.length === 0) {
//         return res.status(200).json({ success: true, message: 'No data from web demo to sync.' });
//     }

//     try {
//         const larkAccessToken = await getLarkTenantAccessToken();
//         if (!larkAccessToken) {
//             return res.status(500).json({ success: false, message: 'Failed to get Lark access token.' });
//         }

//         const recordsForLark = transformDataForLark(webDemoData);
//         if (recordsForLark.length === 0 && webDemoData.length > 0) {
//             return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark. Check mapping and input data structure.' });
//         }
//         if (recordsForLark.length === 0) {
//             return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
//         }

//         const CHUNK_SIZE = 450;
//         let allChunksSentSuccessfully = true;
//         let totalRecordsSyncedToLark = 0;

//         for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE) {
//             const chunk = recordsForLark.slice(i, i + CHUNK_SIZE);
//             console.log(`[SLS_LOG] Handler: Đang gửi lô ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(recordsForLark.length / CHUNK_SIZE)}, kích thước: ${chunk.length}`);
//             const sendResult = await sendDataToLarkBase(larkAccessToken, chunk);

//             if (sendResult.success) {
//                 totalRecordsSyncedToLark += sendResult.processedCount !== undefined ? sendResult.processedCount : chunk.length;
//             } else {
//                 allChunksSentSuccessfully = false;
//                 console.error(`[SLS_LOG] Handler: Lỗi khi gửi lô dữ liệu. Chi tiết:`, sendResult.errorDetails);
//             }
//             if (recordsForLark.length > CHUNK_SIZE && i + CHUNK_SIZE < recordsForLark.length && allChunksSentSuccessfully) {
//                 await new Promise(resolve => setTimeout(resolve, 1000));
//             }
//         }

//         if (allChunksSentSuccessfully) {
//             return res.status(200).json({ success: true, message: `Data sync potentially completed. ${totalRecordsSyncedToLark} records processed by Lark.` });
//         } else {
//             return res.status(207).json({ success: false, message: `Data sync partially failed. ${totalRecordsSyncedToLark} records may have been processed. Check logs for details.` });
//         }
//     } catch (e: any) {
//         console.error("[SLS_LOG] Handler: LỖI KHÔNG XÁC ĐỊNH:", e.message, e.stack);
//         return res.status(500).json({ success: false, message: 'An unexpected error occurred.', error: e.message });
//     }
// }








// // // Đặt file này trong thư mục api của dự án Vercel, ví dụ: api/sync-to-lark.ts
// // import type { VercelRequest, VercelResponse } from '@vercel/node';
// // import fetch from 'node-fetch'; // yarn add node-fetch@2 hoặc npm install node-fetch@2

// // // --- CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL ---
// // const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760fa9069b85010';
// // const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'BMdZmUVSCztTo4o78CbkfgEXtN4RAbWo';
// // const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
// // const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng
// // //const ALLOWED_CORS_ORIGIN = process.env.ALLOWED_CORS_ORIGIN || '*'; // Đặt thành domain web demo của bạn trong production
// // // --- KẾT THÚC CẤU HÌNH ---

// // async function getLarkTenantAccessToken(): Promise<string | null> {
// //     console.log('[SLS_LOG] getLarkTenantAccessToken: Bắt đầu lấy token...');
// //     if (!LARK_APP_ID || !LARK_APP_SECRET) {
// //         console.error('[SLS_LOG] getLarkTenantAccessToken: LARK_APP_ID hoặc LARK_APP_SECRET chưa được cấu hình.');
// //         return null;
// //     }
// //     try {
// //         const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
// //             method: 'POST',
// //             headers: { 'Content-Type': 'application/json; charset=utf-8' },
// //             body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
// //         });
// //         const responseText = await response.text();
// //         if (!response.ok) {
// //             console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi HTTP từ API Lark Auth:', response.status, responseText);
// //             return null;
// //         }
// //         try {
// //             const data: any = JSON.parse(responseText);
// //             if (data.code === 0 && data.tenant_access_token) {
// //                 console.log('[SLS_LOG] getLarkTenantAccessToken: Lấy Tenant Access Token thành công.');
// //                 return data.tenant_access_token;
// //             } else {
// //                 console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi logic từ API Lark Auth:', data);
// //                 return null;
// //             }
// //         } catch (jsonError: any) {
// //             console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi parse JSON từ API Lark Auth:', jsonError.message, 'Dữ liệu text:', responseText);
// //             return null;
// //         }
// //     } catch (error: any) {
// //         console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi mạng hoặc lỗi khác:', error.message);
// //         return null;
// //     }
// // }

// // async function getAllRecordIds(accessToken: string): Promise<string[] | null> {
// //     console.log('[SLS_LOG] getAllRecordIds: Bắt đầu lấy tất cả record_ids...');
// //     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
// //         console.error('[SLS_LOG] getAllRecordIds: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
// //         return null;
// //     }

// //     let allRecordIds: string[] = [];
// //     let pageToken: string | undefined = undefined;
// //     let hasMore = true;
// //     const listRecordsUrlBase = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records`;

// //     try {
// //         while (hasMore) {
// //             let url = listRecordsUrlBase;
// //             const queryParams = new URLSearchParams();
// //             if (pageToken) {
// //                 queryParams.append('page_token', pageToken);
// //             }
// //             // Chỉ lấy trường record_id để giảm tải dữ liệu và tránh lỗi thiếu quyền field nếu chỉ cần ID
// //             queryParams.append('field_names', '[]'); // Yêu cầu không lấy trường nào cụ thể, record_id sẽ tự có
// //             queryParams.append('automatic_fields', 'false'); // Không lấy các trường tự động của Lark

// //             url += `?${queryParams.toString()}`;

// //             console.log(`[SLS_LOG] getAllRecordIds: Fetching page: ${url}`);
// //             const response = await fetch(url, {
// //                 method: 'GET',
// //                 headers: {
// //                     'Authorization': `Bearer ${accessToken}`,
// //                     'Content-Type': 'application/json; charset=utf-8',
// //                 },
// //             });
// //             const responseText = await response.text();
// //             if (!response.ok) {
// //                 console.error(`[SLS_LOG] getAllRecordIds: Lỗi HTTP khi lấy danh sách bản ghi: ${response.status}`, responseText);
// //                 return null;
// //             }
// //             const data: any = JSON.parse(responseText);
// //             if (data.code === 0 && data.data && data.data.items) {
// //                 data.data.items.forEach((item: any) => {
// //                     if (item.record_id) {
// //                         allRecordIds.push(item.record_id);
// //                     }
// //                 });
// //                 hasMore = data.data.has_more;
// //                 pageToken = data.data.page_token;
// //                 console.log(`[SLS_LOG] getAllRecordIds: Lấy được ${data.data.items.length} record_ids. Has more: ${hasMore}. Total so far: ${allRecordIds.length}`);
// //             } else {
// //                 console.error('[SLS_LOG] getAllRecordIds: Lỗi logic từ API List Records:', data);
// //                 return null;
// //             }
// //         }
// //         console.log(`[SLS_LOG] getAllRecordIds: Lấy thành công tổng cộng ${allRecordIds.length} record_ids.`);
// //         return allRecordIds;
// //     } catch (error: any) {
// //         console.error('[SLS_LOG] getAllRecordIds: Lỗi mạng hoặc lỗi khác:', error.message);
// //         return null;
// //     }
// // }

// // async function deleteRecordsInBatches(accessToken: string, recordIds: string[]): Promise<boolean> {
// //     if (!recordIds || recordIds.length === 0) {
// //         console.log('[SLS_LOG] deleteRecordsInBatches: Không có record_id nào để xóa.');
// //         return true;
// //     }
// //     console.log(`[SLS_LOG] deleteRecordsInBatches: Bắt đầu xóa ${recordIds.length} bản ghi...`);
// //     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
// //         console.error('[SLS_LOG] deleteRecordsInBatches: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
// //         return false;
// //     }

// //     const batchDeleteUrl = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_delete`;
// //     const CHUNK_SIZE_DELETE = 500;
// //     let allChunksDeletedSuccessfully = true;

// //     for (let i = 0; i < recordIds.length; i += CHUNK_SIZE_DELETE) {
// //         const chunk = recordIds.slice(i, i + CHUNK_SIZE_DELETE);
// //         console.log(`[SLS_LOG] deleteRecordsInBatches: Đang xóa lô ${Math.floor(i / CHUNK_SIZE_DELETE) + 1}, kích thước: ${chunk.length}`);
// //         try {
// //             const response = await fetch(batchDeleteUrl, {
// //                 method: 'POST',
// //                 headers: {
// //                     'Authorization': `Bearer ${accessToken}`,
// //                     'Content-Type': 'application/json; charset=utf-8',
// //                 },
// //                 body: JSON.stringify({ records: chunk }),
// //             });
// //             const responseText = await response.text();
// //             if (!response.ok) {
// //                 console.error(`[SLS_LOG] deleteRecordsInBatches: Lỗi HTTP khi xóa lô bản ghi: ${response.status}`, responseText);
// //                 allChunksDeletedSuccessfully = false;
// //             } else {
// //                 const data: any = JSON.parse(responseText);
// //                 if (data.code === 0) {
// //                     const failedCount = data.data?.failed_records?.length || 0;
// //                     console.log(`[SLS_LOG] deleteRecordsInBatches: Xóa lô thành công. Records failed: ${failedCount}`);
// //                     if (failedCount > 0) {
// //                         allChunksDeletedSuccessfully = false;
// //                         console.warn('[SLS_LOG] deleteRecordsInBatches: Một số bản ghi trong lô không xóa được:', data.data.failed_records);
// //                     }
// //                 } else {
// //                     console.error('[SLS_LOG] deleteRecordsInBatches: Lỗi logic từ API Batch Delete:', data);
// //                     allChunksDeletedSuccessfully = false;
// //                 }
// //             }
// //         } catch (error: any) {
// //             console.error('[SLS_LOG] deleteRecordsInBatches: Lỗi mạng hoặc lỗi khác khi xóa lô:', error.message);
// //             allChunksDeletedSuccessfully = false;
// //         }
// //         if (recordIds.length > CHUNK_SIZE_DELETE && i + CHUNK_SIZE_DELETE < recordIds.length && allChunksDeletedSuccessfully) {
// //             await new Promise(resolve => setTimeout(resolve, 1000)); // Delay giữa các lô xóa
// //         }
// //     }
// //     return allChunksDeletedSuccessfully;
// // }

// // // =====================================================================================
// // // HÀM NÀY BẠN PHẢI TÙY CHỈNH CHO KHỚP VỚI DỮ LIỆU WEB DEMO VÀ BẢNG LARK BASE
// // function transformDataForLark(webDemoDataArray: any[]): Array<{ fields: Record<string, any> }> {
// //     console.log(`[SLS_LOG] transformDataForLark: Bắt đầu chuyển đổi ${webDemoDataArray ? webDemoDataArray.length : 0} bản ghi...`);
// //     if (!webDemoDataArray || !Array.isArray(webDemoDataArray) || webDemoDataArray.length === 0) {
// //         return [];
// //     }

// //     const transformedRecords = webDemoDataArray.map((element, index) => {
// //         // Kiểm tra cơ bản cấu trúc element (là mảng và có đủ phần tử tối thiểu bạn cần)
// //         if (!Array.isArray(element) || element.length < 13) { // Ví dụ: cần ít nhất 13 phần tử để lấy element[12]
// //             console.warn(`[SLS_LOG] transformDataForLark: Bỏ qua phần tử không hợp lệ ở index ${index}:`, JSON.stringify(element).substring(0,100)+"...");
// //             return null;
// //         }
// //         const checkInTimestamp = element[7] ? Number(element[7]) : null;
// //         const checkOutTimestamp = element[8] ? Number(element[8]) : null;
// //         const bookingTimestamp = element[6] ? Number(element[6]) : null;
// //         const totalNightsCalculated = calculateTotalNights(checkInTimestamp, checkOutTimestamp);
// //         const priceRaw = element[9];
// //         const cancelFeeRaw = element[4];

// //         const fieldsForLark: Record<string, any> = {
// //             // --- THAY THẾ CÁC KEY DƯỚI ĐÂY BẰNG TÊN CỘT HOẶC FIELD ID TRONG LARK BASE CỦA BẠN ---
// //             // Đảm bảo kiểu dữ liệu phù hợp với cột trong Lark Base

// //             //"Plafform" : Number(element[1]),
// //             //"52. Order Number": String(element[0] || ''), // Giả sử đây là Tên Cột trong Lark Base
// //             //"Guest Name" : String(element[10] || ''),
// //              "Plafform": String(element[1] || ''),
// //             "52. Order Number": String(element[0] || ''),
// //             "Guest Name": String(element[10] || ''),
// //             //  "Platform": String(element[1] || ''),
// //             //  "Guest Name": String(element[10] || ''),
// //             //  "14Checking in Date auto": checkInTimestamp ? new Date(checkInTimestamp * 1000).getTime() : null,
// //             //  "24.Total Amount auto": priceRaw,
// //              //"Check Out": checkoutTimestamp ? new Date(checkoutTimestamp * 1000).getTime() : null,
// //             // "Total Nights": totalNightsCalculated === '' ? null : Number(totalNightsCalculated),
// //             // "Phone": String(element[2] || ''),
// //             // "Price (VND)": priceRaw != null ? parseFloat(String(priceRaw).replace(/,/g, '')) : null,
// //             // "Room Type": String(element[5] || ''),
// //             // "Status Order": String(element[12] ? element[12] : 'Confirmed'),
// //             // "Cancellation Fee (VND)": cancelFeeRaw != null ? parseFloat(String(cancelFeeRaw).replace(/,/g, '')) : null,
// //             // "Booking Time": bookingTimestamp ? new Date(bookingTimestamp * 1000).getTime() : null,
// //             // "Room ID": String(element[11] || ''),
// //             // "Price Per Night (VND)": /* tính toán nếu cần */,
// //             // --- KẾT THÚC PHẦN CẦN THAY THẾ ---
// //         };
        
// //         const cleanedFields: Record<string, any> = {};
// //         for (const key in fieldsForLark) {
// //             if (fieldsForLark[key] !== null && fieldsForLark[key] !== undefined) {
// //                 cleanedFields[key] = fieldsForLark[key];
// //             }
// //         }
// //         if (Object.keys(cleanedFields).length === 0) {
// //             console.warn(`[SLS_LOG] transformDataForLark: Bản ghi ở index ${index} rỗng sau khi làm sạch.`);
// //             return null;
// //         }

// //         if (index < 2) {
// //              console.log(`[SLS_LOG] transformDataForLark: Ví dụ bản ghi ${index+1} đã transform:`, JSON.stringify({ fields: cleanedFields }));
// //         }
// //         return { fields: cleanedFields };

// //     }).filter(record => record !== null);

// //     console.log(`[SLS_LOG] transformDataForLark: Chuyển đổi thành công ${transformedRecords.length} bản ghi.`);
// //     return transformedRecords;
// // }
// // // =====================================================================================

// // async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<{success: boolean, processedCount?: number, errorDetails?: any}> {
// //     // ... (Hàm sendDataToLarkBase giữ nguyên như ở câu trả lời trước)
// //     console.log(`[SLS_LOG] sendDataToLarkBase: Bắt đầu gửi ${records.length} bản ghi...`);
// //     if (!records || records.length === 0) {
// //         return { success: true, processedCount: 0 };
// //     }
// //     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
// //         return { success: false, errorDetails: "LARK_BASE_APP_TOKEN or LARK_TABLE_ID not configured." };
// //     }
// //     const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
// //     try {
// //         const response = await fetch(url, {
// //             method: 'POST',
// //             headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=utf-8' },
// //             body: JSON.stringify({ records }),
// //         });
// //         const responseText = await response.text();
// //         if (!response.ok) {
// //             return { success: false, errorDetails: { status: response.status, text: responseText } };
// //         }
// //         const data: any = JSON.parse(responseText);
// //         if (data.code === 0) {
// //             return { success: true, processedCount: data.data?.records?.length || 0 };
// //         } else {
// //             return { success: false, errorDetails: data };
// //         }
// //     } catch (error: any) {
// //         return { success: false, errorDetails: error.message };
// //     }
// // }

// // // --- Helper functions ---
// // function getDay(timestampInSeconds: number | null | undefined): string | null {
// //     if (timestampInSeconds === null || timestampInSeconds === undefined || timestampInSeconds === 0) return null;
// //     const numTimestamp = Number(timestampInSeconds);
// //     if (isNaN(numTimestamp)) return null;
// //     const date = new Date(numTimestamp * 1000);
// //     if (isNaN(date.getTime())) return null;
// //     const year = date.getFullYear();
// //     const month = String(date.getMonth() + 1).padStart(2, '0');
// //     const day = String(date.getDate()).padStart(2, '0');
// //     return `${year}-${month}-${day}`;
// // }

// // function calculateTotalNights(checkinTimestamp: number | null | undefined, checkoutTimestamp: number | null | undefined): number | '' {
// //     if (checkinTimestamp === null || checkinTimestamp === undefined || checkoutTimestamp === null || checkoutTimestamp === undefined) return '';
// //     const numCheckin = Number(checkinTimestamp);
// //     const numCheckout = Number(checkoutTimestamp);
// //     if (isNaN(numCheckin) || isNaN(numCheckout)) return '';
// //     try {
// //         const checkinDate = new Date(numCheckin * 1000);
// //         const checkoutDate = new Date(numCheckout * 1000);
// //         if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) return '';
// //         checkinDate.setHours(12, 0, 0, 0);
// //         checkoutDate.setHours(12, 0, 0, 0);
// //         const diffTime = checkoutDate.getTime() - checkinDate.getTime();
// //         if (diffTime < 0) return '';
// //         const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
// //         return diffNights;
// //     } catch (e: any) { return ''; }
// // }

// // // --- Main Handler ---
// // export default async function handler(req: VercelRequest, res: VercelResponse) {
// //     res.setHeader('Access-Control-Allow-Origin', ALLOWED_CORS_ORIGIN);
// //     res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
// //     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
// //     if (req.method === 'OPTIONS') {
// //         console.log('[SLS_LOG] Handler: OPTIONS request (preflight).');
// //         return res.status(200).end();
// //     }

// //     console.log('[SLS_LOG] Handler: Bắt đầu XÓA và ĐỒNG BỘ dữ liệu...');
// //     if (req.method !== 'POST') {
// //         res.setHeader('Allow', ['POST', 'OPTIONS']);
// //         return res.status(405).json({ success: false, message: 'Method Not Allowed.' });
// //     }

// //     const webDemoPayload = req.body;
// //     if (!webDemoPayload || !webDemoPayload.rawOrderData || !Array.isArray(webDemoPayload.rawOrderData)) {
// //         return res.status(400).json({ success: false, message: 'Invalid payload. Expecting { "rawOrderData": [...] }.' });
// //     }
// //     const webDemoData = webDemoPayload.rawOrderData;
// //     console.log(`[SLS_LOG] Handler: Nhận được ${webDemoData.length} bản ghi từ Web Demo.`);

// //     try {
// //         const larkAccessToken = await getLarkTenantAccessToken();
// //         if (!larkAccessToken) {
// //             return res.status(500).json({ success: false, message: 'Failed to get Lark access token.' });
// //         }
// //         console.log('[SLS_LOG] Handler: Đã lấy Lark Access Token.');

// //         // --- XÓA BẢN GHI CŨ ---
// //         const oldRecordIds = await getAllRecordIds(larkAccessToken);
// //         if (oldRecordIds === null) {
// //             console.error('[SLS_LOG] Handler: Không thể lấy old record IDs. Dừng lại.');
// //             return res.status(500).json({ success: false, message: 'Failed to retrieve old record IDs to delete.' });
// //         }
// //         if (oldRecordIds.length > 0) {
// //             console.log(`[SLS_LOG] Handler: Tìm thấy ${oldRecordIds.length} bản ghi cũ, bắt đầu xóa...`);
// //             const deleteSuccess = await deleteRecordsInBatches(larkAccessToken, oldRecordIds);
// //             if (!deleteSuccess) {
// //                 console.warn('[SLS_LOG] Handler: Có lỗi khi xóa một số bản ghi cũ.');
// //                 // Bạn có thể quyết định dừng ở đây nếu việc xóa là bắt buộc phải thành công 100%
// //                 // return res.status(500).json({ success: false, message: 'Failed to delete all old records.' });
// //             } else {
// //                 console.log('[SLS_LOG] Handler: Hoàn tất việc cố gắng xóa bản ghi cũ.');
// //             }
// //         } else {
// //             console.log('[SLS_LOG] Handler: Không có bản ghi cũ nào trong bảng để xóa.');
// //         }
// //         // --- KẾT THÚC XÓA ---

// //         if (webDemoData.length === 0) {
// //             return res.status(200).json({ success: true, message: 'No new data from web demo to sync. Old data (if any) processed for deletion.' });
// //         }

// //         const recordsForLark = transformDataForLark(webDemoData);
// //         if (recordsForLark.length === 0 && webDemoData.length > 0) {
// //             return res.status(200).json({ success: true, message: 'Web demo data found but no records transformed for Lark. Check mapping/data structure.' });
// //         }
// //         if (recordsForLark.length === 0) {
// //             return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
// //         }

// //         const CHUNK_SIZE_CREATE = 450;
// //         let allNewChunksSentSuccessfully = true;
// //         let totalNewRecordsSyncedToLark = 0;

// //         for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE_CREATE) {
// //             const chunk = recordsForLark.slice(i, i + CHUNK_SIZE_CREATE);
// //             console.log(`[SLS_LOG] Handler: Đang gửi lô bản ghi MỚI ${Math.floor(i/CHUNK_SIZE_CREATE)+1}, kích thước: ${chunk.length}`);
// //             const sendResult = await sendDataToLarkBase(larkAccessToken, chunk);
// //             if (sendResult.success) {
// //                 totalNewRecordsSyncedToLark += sendResult.processedCount !== undefined ? sendResult.processedCount : chunk.length;
// //             } else {
// //                 allNewChunksSentSuccessfully = false;
// //                 console.error(`[SLS_LOG] Handler: Lỗi gửi lô bản ghi MỚI. Chi tiết:`, sendResult.errorDetails);
// //             }
// //             if (recordsForLark.length > CHUNK_SIZE_CREATE && i + CHUNK_SIZE_CREATE < recordsForLark.length && allNewChunksSentSuccessfully) {
// //                 await new Promise(resolve => setTimeout(resolve, 1000));
// //             }
// //         }

// //         if (allNewChunksSentSuccessfully) {
// //             return res.status(200).json({ success: true, message: `Data sync completed. ${totalNewRecordsSyncedToLark} new records processed by Lark.` });
// //         } else {
// //             return res.status(207).json({ success: false, message: `New data sync partially failed. ${totalNewRecordsSyncedToLark} records may have been processed. Check logs.` });
// //         }
// //     } catch (e: any) {
// //         console.error("[SLS_LOG] Handler: LỖI KHÔNG XÁC ĐỊNH:", e.message, e.stack);
// //         return res.status(500).json({ success: false, message: 'An unexpected server error occurred.', error: e.message });
// //     }
// // }




//ĐOẠN CODE ĐÃ CÓ PHẦN XÓA CÁC BẢN GHI


// // Đặt file này trong thư mục api của dự án Vercel, ví dụ: api/sync-to-lark.ts
// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import fetch from 'node-fetch'; // yarn add node-fetch@2 hoặc npm install node-fetch@2

// // --- CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL ---
// const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760fa9069b85010';
// const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'BMdZmUVSCztTo4o78CbkfgEXtN4RAbWo';
// const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb'; // :app_token của Base
// const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t'; // :table_id của Bảng
// // --- KẾT THÚC CẤU HÌNH ---

// // --- Các hàm helper đã có ---
// async function getLarkTenantAccessToken(): Promise<string | null> {
//     console.log('[SLS_LOG] getLarkTenantAccessToken: Bắt đầu lấy token...');
//     if (!LARK_APP_ID || !LARK_APP_SECRET) {
//         console.error('[SLS_LOG] getLarkTenantAccessToken: LARK_APP_ID hoặc LARK_APP_SECRET chưa được cấu hình trong biến môi trường.');
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
//             console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi parse JSON từ API Lark Auth:', jsonError.message, 'Dữ liệu text nhận được:', responseText);
//             return null;
//         }
//     } catch (error: any) {
//         console.error('[SLS_LOG] getLarkTenantAccessToken: Lỗi mạng hoặc lỗi khác:', error.message);
//         return null;
//     }
// }

// function getDay (timestampInSeconds: any): string { // Sửa kiểu dữ liệu nếu cần
//     if (!timestampInSeconds) return '';
//     const date = new Date(Number(timestampInSeconds) * 1000);
//     if (isNaN(date.getTime())) return '';
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// }

// function formatCurrency(value: any): string { // Sửa kiểu dữ liệu nếu cần
//     if (value === null || value === undefined || value === '') {
//         return '';
//     }
//     const numberValue = parseFloat(String(value).replace(/,/g, ''));
//     if (isNaN(numberValue)) {
//         return String(value);
//     }
//     try {
//         return numberValue.toLocaleString('en-US', {
//              maximumFractionDigits: 0
//         });
//     } catch (e) {
//         return String(numberValue);
//     }
// }

// function calculateTotalNights(checkinTimestamp: any, checkoutTimestamp: any): string | number { // Sửa kiểu dữ liệu nếu cần
//   if (!checkinTimestamp || !checkoutTimestamp) {
//     return '';
//   }
//   try {
//     const checkinDate = new Date(Number(checkinTimestamp) * 1000);
//     const checkoutDate = new Date(Number(checkoutTimestamp) * 1000);

//     if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
//        return '';
//     }
//     checkinDate.setHours(12, 0, 0, 0);
//     checkoutDate.setHours(12, 0, 0, 0);
//     const diffTime = checkoutDate.getTime() - checkinDate.getTime();
//     if (diffTime < 0) return '';
//     const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
//     return diffNights;
//   } catch (e) {
//     return '';
//   }
// }

// // --- HÀM MỚI: Lấy tất cả record_ids ---
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
//             // Chỉ yêu cầu trường record_id (hoặc không yêu cầu trường nào cụ thể, record_id thường được trả về mặc định)
//             // Để chắc chắn, chúng ta có thể không truyền field_names hoặc truyền mảng rỗng
//             // queryParams.append('field_names', '["record_id"]'); // Hoặc để trống nếu record_id là mặc định
//             queryParams.append('page_size', '500'); // Lấy tối đa 500 record mỗi lần
//             queryParams.append('automatic_fields', 'false'); // Không lấy các trường tự động của Lark

//             if (queryParams.toString()) {
//                 url += `?${queryParams.toString()}`;
//             }

//             console.log(`[SLS_LOG] getAllRecordIds: Fetching page: ${url.substring(0,200)}...`);
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
//                 console.log(`[SLS_LOG] getAllRecordIds: Lấy được ${data.data.items.length} record_ids. Has more: ${hasMore}. Page token: ${pageToken ? 'yes' : 'no'}. Total so far: ${allRecordIds.length}`);
//             } else {
//                 console.error('[SLS_LOG] getAllRecordIds: Lỗi logic từ API List Records:', data);
//                 return null; // Dừng nếu có lỗi logic
//             }
//              if (hasMore) {
//                 await new Promise(resolve => setTimeout(resolve, 300)); // Delay nhỏ giữa các request để tránh rate limit
//             }
//         }
//         console.log(`[SLS_LOG] getAllRecordIds: Lấy thành công tổng cộng ${allRecordIds.length} record_ids.`);
//         return allRecordIds;
//     } catch (error: any) {
//         console.error('[SLS_LOG] getAllRecordIds: Lỗi mạng hoặc lỗi khác:', error.message);
//         return null;
//     }
// }

// // --- HÀM MỚI: Xóa các bản ghi theo lô ---
// async function deleteRecordsInBatches(accessToken: string, recordIds: string[]): Promise<boolean> {
//     if (!recordIds || recordIds.length === 0) {
//         console.log('[SLS_LOG] deleteRecordsInBatches: Không có record_id nào để xóa.');
//         return true; // Coi như thành công nếu không có gì để xóa
//     }
//     console.log(`[SLS_LOG] deleteRecordsInBatches: Bắt đầu xóa ${recordIds.length} bản ghi...`);
//     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
//         console.error('[SLS_LOG] deleteRecordsInBatches: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
//         return false;
//     }

//     const batchDeleteUrl = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_delete`;
//     // Lark API giới hạn tối đa 500 record_ids cho mỗi lần batch_delete
//     const CHUNK_SIZE_DELETE = 500;
//     let allChunksDeletedSuccessfully = true;

//     for (let i = 0; i < recordIds.length; i += CHUNK_SIZE_DELETE) {
//         const chunk = recordIds.slice(i, i + CHUNK_SIZE_DELETE);
//         console.log(`[SLS_LOG] deleteRecordsInBatches: Đang xóa lô ${Math.floor(i / CHUNK_SIZE_DELETE) + 1}/${Math.ceil(recordIds.length/CHUNK_SIZE_DELETE)}, kích thước: ${chunk.length}`);
//         try {
//             const response = await fetch(batchDeleteUrl, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json; charset=utf-8',
//                 },
//                 body: JSON.stringify({ records: chunk }), // API yêu cầu một mảng các record_id
//             });
//             const responseText = await response.text();
//             if (!response.ok) {
//                 console.error(`[SLS_LOG] deleteRecordsInBatches: Lỗi HTTP khi xóa lô bản ghi: ${response.status}`, responseText);
//                 allChunksDeletedSuccessfully = false;
//                 // Có thể thêm break ở đây nếu muốn dừng ngay khi có lỗi
//             } else {
//                 const data: any = JSON.parse(responseText);
//                 if (data.code === 0) {
//                     // API trả về một mảng `records` chứa các record_id đã được xóa thành công
//                     // và một mảng `failed_records` chứa các record_id không xóa được
//                     const failedCount = data.data?.failed_records?.length || 0;
//                     console.log(`[SLS_LOG] deleteRecordsInBatches: Xóa lô thành công. Records failed: ${failedCount}. Records deleted in this chunk: ${data.data?.records?.length || 0}`);
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
//         // Delay nhỏ giữa các lô để tránh rate limit, đặc biệt nếu có nhiều lô
//         if (recordIds.length > CHUNK_SIZE_DELETE && i + CHUNK_SIZE_DELETE < recordIds.length && allChunksDeletedSuccessfully) {
//             await new Promise(resolve => setTimeout(resolve, 1000)); // 1 giây
//         }
//     }
//     console.log(`[SLS_LOG] deleteRecordsInBatches: Hoàn tất quá trình xóa. Tổng thể thành công: ${allChunksDeletedSuccessfully}`);
//     return allChunksDeletedSuccessfully;
// }

// // --- Hàm transformDataForLark (giữ nguyên hoặc tùy chỉnh) ---
// function transformDataForLark(webDemoDataArray: any[]): Array<{ fields: Record<string, any> }> {
//     console.log(`[SLS_LOG] transformDataForLark: Bắt đầu chuyển đổi ${webDemoDataArray ? webDemoDataArray.length : 0} bản ghi...`);
//     if (!webDemoDataArray || !Array.isArray(webDemoDataArray) || webDemoDataArray.length === 0) {
//         console.log('[SLS_LOG] transformDataForLark: Không có dữ liệu đầu vào.');
//         return [];
//     }

//     const transformedRecords = webDemoDataArray.map((element, index) => {
//         if (!Array.isArray(element) || element.length < 13) {
//             console.warn(`[SLS_LOG] transformDataForLark: Bỏ qua phần tử không hợp lệ ở index ${index}:`, JSON.stringify(element).substring(0,100) + "...");
//             return null;
//         }

//         const cancelFeeRaw = element[4];
//         const priceRaw = element[9];
//         const totalnight = calculateTotalNights(element[7], element[8]);
//         const pricenightRaw = Number(totalnight) > 0 ? Number(String(priceRaw).replace(/,/g, '')) / Number(totalnight) : '';

//         const fieldsForLark: Record<string, any> = {
//             "Plafform": String(element[1] || ''),
//             "52. Order Number": String(element[0] || ''),
//             "Guest Name": String(element[10] || ''),
//             "Check In" : getDay(element[7]), // Đảm bảo getDay trả về string hoặc null
//             "Check Out" : getDay(element[8]),
//             "Price" : formatCurrency(priceRaw), // Đảm bảo formatCurrency trả về string
//             "Room Type": String(element[5] || ''),
//             "Status Order": String(element[12] ? element[12] : 'Confirmed'),
//             "Cancellation Fee": formatCurrency(cancelFeeRaw),
//             "Booking Time" : getDay(element[6]),
//             "RoomID" : String(element[11] || ''),
//             "Phone": String(element[2] || ''),
//             "Total Night": String(totalnight), // Chuyển sang string
//             "Price One Night": formatCurrency(pricenightRaw),
//         };

//         const cleanedFields: Record<string, any> = {};
//         for (const key in fieldsForLark) {
//             if (fieldsForLark[key] !== null && fieldsForLark[key] !== undefined) {
//                  // Lark thường mong đợi string cho các trường Text.
//                 // Nếu giá trị là số và cột Lark là Text, chuyển nó thành string.
//                 // Nếu cột Lark là Number, đảm bảo giá trị là số.
//                 // Các trường Date/Timestamp cần được định dạng đúng (thường là timestamp millisecond cho Lark).
//                 // Trong ví dụ này, giả sử các cột Text chấp nhận string rỗng.
//                 cleanedFields[key] = fieldsForLark[key];

//             }
//         }
//          if (Object.keys(cleanedFields).length === 0 && Object.keys(fieldsForLark).length > 0) {
//             console.warn(`[SLS_LOG] transformDataForLark: Bản ghi ở index ${index} không có trường nào có giá trị sau khi làm sạch, nhưng có trường ban đầu.`);
//          }
//          if (Object.keys(cleanedFields).length === 0) return null;

//         if (index < 2) {
//              console.log(`[SLS_LOG] transformDataForLark: Ví dụ bản ghi ${index+1} đã transform:`, JSON.stringify({ fields: cleanedFields }));
//         }
//         return { fields: cleanedFields };

//     }).filter(record => record !== null) as Array<{ fields: Record<string, any> }>; // Type assertion

//     console.log(`[SLS_LOG] transformDataForLark: Chuyển đổi thành công ${transformedRecords.length} bản ghi.`);
//     return transformedRecords;
// }

// // --- Hàm sendDataToLarkBase (giữ nguyên) ---
// async function sendDataToLarkBase(accessToken: string, records: Array<{ fields: Record<string, any> }>): Promise<{success: boolean, processedCount?: number, errorDetails?: any}> {
//     console.log(`[SLS_LOG] sendDataToLarkBase: Bắt đầu gửi ${records.length} bản ghi...`);
//     if (!records || records.length === 0) {
//         console.log('[SLS_LOG] sendDataToLarkBase: Không có bản ghi nào để gửi.');
//         return { success: true, processedCount: 0 };
//     }
//     if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
//         console.error('[SLS_LOG] sendDataToLarkBase: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
//         return { success: false, errorDetails: "LARK_BASE_APP_TOKEN or LARK_TABLE_ID not configured." };
//     }

//     const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json; charset=utf-8',
//             },
//             body: JSON.stringify({ records }),
//         });
//         const responseText = await response.text();
//         if (!response.ok) {
//             console.error(`[SLS_LOG] sendDataToLarkBase: Lỗi HTTP từ API Lark Base: ${response.status}`, responseText);
//             return { success: false, errorDetails: { status: response.status, text: responseText } };
//         }
//         try {
//             const data: any = JSON.parse(responseText);
//             if (data.code === 0) {
//                 const processed = data.data?.records?.length || 0;
//                 console.log(`[SLS_LOG] sendDataToLarkBase: Gửi dữ liệu đến Lark Base thành công: ${processed} bản ghi đã được xử lý.`);
//                 return { success: true, processedCount: processed };
//             } else {
//                 console.error('[SLS_LOG] sendDataToLarkBase: Lỗi logic từ API Lark Base:', data);
//                 return { success: false, errorDetails: data };
//             }
//         } catch (jsonError: any) {
//             console.error('[SLS_LOG] sendDataToLarkBase: Lỗi parse JSON từ Lark Base API:', jsonError.message, 'Dữ liệu text nhận được:', responseText);
//             return { success: false, errorDetails: { parseError: jsonError.message, rawText: responseText } };
//         }
//     } catch (error: any) {
//         console.error('[SLS_LOG] sendDataToLarkBase: Lỗi mạng hoặc lỗi khác:', error.message);
//         return { success: false, errorDetails: error.message };
//     }
// }


// // --- Main Handler ---
// export default async function handler(req: VercelRequest, res: VercelResponse) {
//     const allowedOrigin = process.env.ALLOWED_CORS_ORIGIN || '*';
//     res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
//     res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

//     if (req.method === 'OPTIONS') {
//         console.log('[SLS_LOG] Handler: OPTIONS request received (preflight).');
//         return res.status(200).end();
//     }

//     console.log('[SLS_LOG] Handler: Bắt đầu quá trình XÓA và ĐỒNG BỘ dữ liệu từ Web Demo POST...');

//     if (req.method !== 'POST') {
//         console.warn(`[SLS_LOG] Handler: Phương thức không hợp lệ: ${req.method}`);
//         res.setHeader('Allow', ['POST', 'OPTIONS']);
//         return res.status(405).json({ success: false, message: 'Method Not Allowed, please use POST.' });
//     }

//     const webDemoPayload = req.body;
//     if (!webDemoPayload || !webDemoPayload.rawOrderData) {
//         console.error('[SLS_LOG] Handler: Dữ liệu không hợp lệ. Thiếu "rawOrderData". Body:', typeof webDemoPayload, Object.keys(webDemoPayload || {}));
//         return res.status(400).json({ success: false, message: 'Invalid payload. Expecting { "rawOrderData": [...] }.' });
//     }

//     const webDemoData = webDemoPayload.rawOrderData;
//     if (!Array.isArray(webDemoData)) {
//         console.error('[SLS_LOG] Handler: "rawOrderData" không phải là mảng. Data type:', typeof webDemoData);
//         return res.status(400).json({ success: false, message: '"rawOrderData" is not an array.' });
//     }

//     console.log(`[SLS_LOG] Handler: Nhận được ${webDemoData.length} bản ghi từ Web Demo.`);

//     try {
//         const larkAccessToken = await getLarkTenantAccessToken();
//         if (!larkAccessToken) {
//             return res.status(500).json({ success: false, message: 'Failed to get Lark access token.' });
//         }
//         console.log('[SLS_LOG] Handler: Đã lấy Lark Access Token.');

//         // --- BƯỚC 1: XÓA TẤT CẢ BẢN GHI CŨ ---
//         console.log('[SLS_LOG] Handler: Bắt đầu lấy danh sách các record_id cũ để xóa...');
//         const oldRecordIds = await getAllRecordIds(larkAccessToken);

//         if (oldRecordIds === null) {
//             // Lỗi nghiêm trọng khi lấy danh sách ID, không nên tiếp tục
//             console.error('[SLS_LOG] Handler: Không thể lấy old record IDs. Dừng quá trình đồng bộ.');
//             return res.status(500).json({ success: false, message: 'Failed to retrieve old record IDs from Lark for deletion.' });
//         }

//         if (oldRecordIds.length > 0) {
//             console.log(`[SLS_LOG] Handler: Tìm thấy ${oldRecordIds.length} bản ghi cũ. Bắt đầu xóa...`);
//             const deleteSuccess = await deleteRecordsInBatches(larkAccessToken, oldRecordIds);
//             if (!deleteSuccess) {
//                 // Có lỗi trong quá trình xóa.
//                 // Tùy theo yêu cầu, bạn có thể quyết định dừng ở đây hoặc tiếp tục ghi dữ liệu mới.
//                 // Hiện tại, chúng ta sẽ ghi log và tiếp tục.
//                 console.warn('[SLS_LOG] Handler: Có lỗi xảy ra trong quá trình xóa một số bản ghi cũ. Tiếp tục ghi dữ liệu mới.');
//                 // Nếu việc xóa là bắt buộc phải thành công 100%, bạn có thể trả về lỗi ở đây:
//                 // return res.status(500).json({ success: false, message: 'Failed to delete all old records from Lark. Sync aborted.' });
//             } else {
//                 console.log('[SLS_LOG] Handler: Hoàn tất việc cố gắng xóa các bản ghi cũ.');
//             }
//         } else {
//             console.log('[SLS_LOG] Handler: Không có bản ghi cũ nào trong bảng Lark để xóa.');
//         }
//         // --- KẾT THÚC BƯỚC 1 ---

//         // Nếu không có dữ liệu mới từ web demo, dừng ở đây sau khi đã xóa (nếu có)
//         if (webDemoData.length === 0) {
//             return res.status(200).json({ success: true, message: 'No new data from web demo to sync. Old data (if any) processed for deletion.' });
//         }

//         // --- BƯỚC 2: CHUẨN BỊ VÀ GỬI DỮ LIỆU MỚI ---
//         const recordsForLark = transformDataForLark(webDemoData);
//         if (recordsForLark.length === 0 && webDemoData.length > 0) {
//             // Có dữ liệu đầu vào nhưng không transform được gì -> có thể do lỗi mapping hoặc cấu trúc dữ liệu
//             console.warn('[SLS_LOG] Handler: Dữ liệu Web Demo có, nhưng không có bản ghi nào được chuyển đổi cho Lark. Kiểm tra mapping và cấu trúc dữ liệu đầu vào.');
//             return res.status(200).json({ success: true, message: 'Web demo data found but no records were transformed for Lark. Check mapping and input data structure.' });
//         }
//         if (recordsForLark.length === 0) {
//             // Không có dữ liệu nào hợp lệ để gửi sau khi transform
//             console.log('[SLS_LOG] Handler: Không có bản ghi hợp lệ nào để gửi đến Lark sau khi chuyển đổi.');
//             return res.status(200).json({ success: true, message: 'No valid records to send to Lark after transformation.' });
//         }

//         const CHUNK_SIZE_CREATE = 450; // Giới hạn của Lark cho batch_create thường là 500, nhưng dùng 450 để an toàn hơn
//         let allNewChunksSentSuccessfully = true;
//         let totalNewRecordsSyncedToLark = 0;

//         for (let i = 0; i < recordsForLark.length; i += CHUNK_SIZE_CREATE) {
//             const chunk = recordsForLark.slice(i, i + CHUNK_SIZE_CREATE);
//             console.log(`[SLS_LOG] Handler: Đang gửi lô bản ghi MỚI ${Math.floor(i / CHUNK_SIZE_CREATE) + 1}/${Math.ceil(recordsForLark.length / CHUNK_SIZE_CREATE)}, kích thước: ${chunk.length}`);
//             const sendResult = await sendDataToLarkBase(larkAccessToken, chunk);

//             if (sendResult.success) {
//                 totalNewRecordsSyncedToLark += sendResult.processedCount !== undefined ? sendResult.processedCount : chunk.length;
//             } else {
//                 allNewChunksSentSuccessfully = false;
//                 console.error(`[SLS_LOG] Handler: Lỗi khi gửi lô bản ghi MỚI. Chi tiết:`, sendResult.errorDetails);
//                 // Bạn có thể `break` vòng lặp ở đây nếu muốn dừng ngay khi có lỗi
//             }
//             // Delay nhỏ giữa các lô nếu có nhiều lô và chưa gặp lỗi
//             if (recordsForLark.length > CHUNK_SIZE_CREATE && i + CHUNK_SIZE_CREATE < recordsForLark.length && allNewChunksSentSuccessfully) {
//                 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 giây
//             }
//         }
//         // --- KẾT THÚC BƯỚC 2 ---

//         if (allNewChunksSentSuccessfully) {
//             return res.status(200).json({ success: true, message: `Data sync potentially completed. ${totalNewRecordsSyncedToLark} new records processed by Lark. Old records (if any) were processed for deletion.` });
//         } else {
//             // Có lỗi xảy ra khi gửi dữ liệu mới
//             return res.status(207).json({ success: false, message: `New data sync partially failed. ${totalNewRecordsSyncedToLark} new records may have been processed. Check logs for details. Old records (if any) were processed for deletion.` });
//         }

//     } catch (e: any) {
//         console.error("[SLS_LOG] Handler: LỖI KHÔNG XÁC ĐỊNH:", e.message, e.stack);
//         return res.status(500).json({ success: false, message: 'An unexpected server error occurred.', error: e.message });
//     }
// }


// ĐOẠN CODE NÀY SẼ THAY ĐỔI 2 GIÁ TRỊ 

// Đặt file này trong thư mục api của dự án Vercel, ví dụ: api/sync-to-lark.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch, { Response as FetchResponse } from 'node-fetch'; // yarn add node-fetch@2 hoặc npm install node-fetch@2

// --- CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL ---
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a760fa9069b85010';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'BMdZmUVSCztTo4o78CbkfgEXtN4RAbWo';
const LARK_BASE_APP_TOKEN = process.env.LARK_BASE_APP_TOKEN || 'FCEIbp9UPag1edsHp6elhUQhgqb';
const LARK_TABLE_ID = process.env.LARK_TABLE_ID || 'tblUi2kEEStEEX0t';

// --- TÊN CỘT TRONG LARK BASE (CẦN KHỚP CHÍNH XÁC) ---
const LARK_COL_ORDER_NUMBER = "52. Order Number"; // THAY THẾ BẰNG TÊN CỘT ORDER NUMBER CỦA BẠN
const LARK_COL_STATUS_ORDER = "Status Order";     // THAY THẾ BẰNG TÊN CỘT STATUS ORDER CỦA BẠN
const LARK_COL_CANCEL_FEE = "Cancellation Fee"; // THAY THẾ BẰNG TÊN CỘT CANCELLATION FEE CỦA BẠN
// Thêm các tên cột khác bạn muốn đồng bộ nếu cần
const LARK_COL_PLATFORM = "Plafform";
const LARK_COL_GUEST_NAME = "Guest Name";
const LARK_COL_CHECK_IN = "Check In";
const LARK_COL_CHECK_OUT = "Check Out";
const LARK_COL_PRICE = "Price";
const LARK_COL_ROOM_TYPE = "Room Type";
const LARK_COL_BOOKING_TIME = "Booking Time";
const LARK_COL_ROOM_ID = "RoomID";
const LARK_COL_PHONE = "Phone";
const LARK_COL_TOTAL_NIGHT = "Total Night";
const LARK_COL_PRICE_ONE_NIGHT = "Price One Night";
// --- KẾT THÚC TÊN CỘT ---


async function getLarkTenantAccessToken(): Promise<string | null> {
    // ... (giữ nguyên hàm này)
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

// --- HÀM MỚI: Lấy tất cả bản ghi hiện có từ Lark với các trường cần thiết ---
interface LarkRecord {
    record_id: string;
    fields: Record<string, any>;
}

async function getAllExistingLarkRecords(accessToken: string): Promise<Record<string, LarkRecord> | null> {
    console.log('[SLS_LOG] getAllExistingLarkRecords: Bắt đầu lấy các bản ghi hiện có từ Lark...');
    if (!LARK_BASE_APP_TOKEN || !LARK_TABLE_ID) {
        console.error('[SLS_LOG] getAllExistingLarkRecords: LARK_BASE_APP_TOKEN hoặc LARK_TABLE_ID chưa được cấu hình.');
        return null;
    }

    const larkRecordsMap: Record<string, LarkRecord> = {};
    let pageToken: string | undefined = undefined;
    let hasMore = true;
    // Các trường cần lấy từ Lark để so sánh và lấy record_id
    const fieldsToFetch = [
        LARK_COL_ORDER_NUMBER,
        LARK_COL_STATUS_ORDER,
        LARK_COL_CANCEL_FEE,
        LARK_COL_PRICE,
        // Thêm các trường khác nếu bạn muốn cập nhật chúng dựa trên logic khác
    ];
    const fieldNamesParam = JSON.stringify(fieldsToFetch);

    try {
        while (hasMore) {
            const queryParams = new URLSearchParams({
                table_id: LARK_TABLE_ID,
                page_size: '450', // Lấy tối đa 500 record mỗi lần
                field_names: fieldNamesParam,
                automatic_fields: 'false' // Không lấy các trường tự động của Lark (như created_by, modified_time) trừ khi cần
            });
            if (pageToken) {
                queryParams.append('page_token', pageToken);
            }

            const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records?${queryParams.toString()}`;
            console.log(`[SLS_LOG] getAllExistingLarkRecords: Fetching page (first 150 chars): ${url.substring(0,150)}...`);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=utf-8' },
            });
            const responseText = await response.text();

            if (!response.ok) {
                console.error(`[SLS_LOG] getAllExistingLarkRecords: Lỗi HTTP ${response.status} khi lấy bản ghi:`, responseText);
                return null;
            }

            const data: any = JSON.parse(responseText);
            if (data.code === 0 && data.data && data.data.items) {
                data.data.items.forEach((item: any) => {
                    const orderNumber = item.fields[LARK_COL_ORDER_NUMBER];
                    if (orderNumber && item.record_id) {
                        // Đảm bảo orderNumber là string để làm key
                        const orderNumStr = String(orderNumber).trim();
                        if (orderNumStr) {
                           larkRecordsMap[orderNumStr] = {
                                record_id: item.record_id,
                                fields: item.fields,
                           };
                        } else {
                            console.warn(`[SLS_LOG] getAllExistingLarkRecords: Bản ghi có record_id ${item.record_id} không có Order Number hoặc Order Number rỗng.`);
                        }
                    } else {
                        // console.warn(`[SLS_LOG] getAllExistingLarkRecords: Bản ghi bị thiếu Order Number hoặc record_id:`, item.record_id);
                    }
                });
                hasMore = data.data.has_more;
                pageToken = data.data.page_token;
                console.log(`[SLS_LOG] getAllExistingLarkRecords: Lấy được ${data.data.items.length} bản ghi. Has more: ${hasMore}. Tổng số trong map: ${Object.keys(larkRecordsMap).length}`);
            } else {
                console.error('[SLS_LOG] getAllExistingLarkRecords: Lỗi logic từ API List Records:', data);
                return null;
            }
            if (hasMore) await new Promise(resolve => setTimeout(resolve, 300)); // Delay
        }
        console.log(`[SLS_LOG] getAllExistingLarkRecords: Lấy thành công ${Object.keys(larkRecordsMap).length} bản ghi vào map.`);
        return larkRecordsMap;
    } catch (error: any) {
        console.error('[SLS_LOG] getAllExistingLarkRecords: Lỗi mạng hoặc lỗi khác:', error.message, error.stack);
        return null;
    }
}


// --- HÀM HELPER (giữ nguyên hoặc tùy chỉnh) ---
function getDay(timestampInSeconds: any): string {
    // ... (giữ nguyên)
    if (!timestampInSeconds) return '';
    const date = new Date(Number(timestampInSeconds) * 1000);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatCurrency(value: any): string {
    // ... (giữ nguyên)
    if (value === null || value === undefined || value === '') {
        return '';
    }
    // Chuyển đổi giá trị sang số, loại bỏ dấu phẩy nếu có
    const numberValue = parseFloat(String(value).replace(/,/g, ''));
    if (isNaN(numberValue)) {
        // console.warn("formatCurrency: Giá trị không hợp lệ:", value);
        return String(value); // Trả về giá trị gốc nếu không phải số
    }
    try {
        // Định dạng số với dấu phẩy ngăn cách hàng nghìn, không có phần thập phân
        return numberValue.toLocaleString('en-US', {
             maximumFractionDigits: 0
        });
    } catch (e) {
        // console.error("Lỗi định dạng tiền tệ:", value, e);
        return String(numberValue); // Trả về số đã được parse nếu toLocaleString lỗi
    }
}

function calculateTotalNights(checkinTimestamp: any, checkoutTimestamp: any): string | number {
    // ... (giữ nguyên)
    if (!checkinTimestamp || !checkoutTimestamp) {
    return '';
    }
    try {
    const checkinDate = new Date(Number(checkinTimestamp) * 1000);
    const checkoutDate = new Date(Number(checkoutTimestamp) * 1000);

    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
       // console.warn("Invalid date for night calculation:", checkinTimestamp, checkoutTimestamp);
       return '';
    }
    // Đặt giờ về trưa để tránh lỗi lệch múi giờ khi tính ngày
    checkinDate.setHours(12, 0, 0, 0);
    checkoutDate.setHours(12, 0, 0, 0);
    const diffTime = checkoutDate.getTime() - checkinDate.getTime();
    if (diffTime < 0) return ''; // Ngày check-out trước ngày check-in
    const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffNights; // Sẽ trả về 0 nếu cùng ngày
    } catch (e) {
    // console.error("Error calculating nights:", e);
    return '';
    }
}


// --- HÀM CHUYỂN ĐỔI DỮ LIỆU (giữ nguyên hoặc tùy chỉnh) ---
// Hàm này giờ sẽ trả về đầy đủ các trường để tạo mới
function transformDataForLarkRecord(element: any[]): Record<string, any> | null {
    if (!Array.isArray(element) || element.length < 13) {
        console.warn(`[SLS_LOG] transformDataForLarkRecord: Bỏ qua phần tử không hợp lệ:`, JSON.stringify(element).substring(0,100) + "...");
        return null;
    }

    const orderNumber = String(element[0] || '').trim();
    if (!orderNumber) {
        console.warn(`[SLS_LOG] transformDataForLarkRecord: Bỏ qua phần tử không có Order Number:`, JSON.stringify(element).substring(0,100) + "...");
        return null;
    }

    const cancelFeeRaw = element[4];
    const priceRaw = element[9];
    const totalNights = calculateTotalNights(element[7], element[8]);
    const pricePerNightRaw = Number(totalNights) > 0 ? (Number(String(priceRaw).replace(/,/g,'')) / Number(totalNights)) : '';

    const fields: Record<string, any> = {
        [LARK_COL_PLATFORM]: String(element[1] || ''),
        [LARK_COL_ORDER_NUMBER]: orderNumber,
        [LARK_COL_GUEST_NAME]: String(element[10] || ''),
        [LARK_COL_CHECK_IN]: getDay(element[7]),
        [LARK_COL_CHECK_OUT]: getDay(element[8]),
        [LARK_COL_PRICE]: formatCurrency(priceRaw),
        [LARK_COL_ROOM_TYPE]: String(element[5] || ''),
        [LARK_COL_STATUS_ORDER]: String(element[12] ? element[12] : 'Confirmed'),
        [LARK_COL_CANCEL_FEE]: formatCurrency(cancelFeeRaw),
        [LARK_COL_BOOKING_TIME]: getDay(element[6]),
        [LARK_COL_ROOM_ID]: String(element[11] || ''),
        [LARK_COL_PHONE]: String(element[2] || ''),
        [LARK_COL_TOTAL_NIGHT]: String(totalNights),
        [LARK_COL_PRICE_ONE_NIGHT]: formatCurrency(pricePerNightRaw),
    };
    
    // Xóa các trường có giá trị null hoặc undefined để tránh lỗi với Lark
    const cleanedFields: Record<string, any> = {};
    for (const key in fields) {
        if (fields[key] !== null && fields[key] !== undefined) {
            cleanedFields[key] = fields[key];
        }
    }
    return cleanedFields;
}

// --- HÀM GỬI DỮ LIỆU LÊN LARK (TẠO MỚI) ---
async function batchCreateLarkRecords(accessToken: string, recordsToCreate: Array<{ fields: Record<string, any> }>): Promise<{success: boolean, createdCount: number, errors: any[]}> {
    // ... (Tương tự sendDataToLarkBase, nhưng đổi tên để rõ ràng)
    console.log(`[SLS_LOG] batchCreateLarkRecords: Bắt đầu tạo ${recordsToCreate.length} bản ghi...`);
    if (!recordsToCreate || recordsToCreate.length === 0) return { success: true, createdCount: 0, errors: [] };

    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_create`;
    let totalCreated = 0;
    const allErrors: any[] = [];

    const CHUNK_SIZE = 450; // Lark API limit
    for (let i = 0; i < recordsToCreate.length; i += CHUNK_SIZE) {
        const chunk = recordsToCreate.slice(i, i + CHUNK_SIZE);
        console.log(`[SLS_LOG] batchCreateLarkRecords: Đang tạo lô ${Math.floor(i/CHUNK_SIZE)+1}, kích thước: ${chunk.length}`);
        try {
            const response: FetchResponse = await fetch(url, { /* ... request options ... */
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ records: chunk }),
            });
            const responseText = await response.text();
            if (!response.ok) {
                console.error(`[SLS_LOG] batchCreateLarkRecords: Lỗi HTTP ${response.status} khi tạo lô:`, responseText);
                allErrors.push({ status: response.status, text: responseText, chunkIndex: i/CHUNK_SIZE });
                continue;
            }
            const data: any = JSON.parse(responseText);
            if (data.code === 0 && data.data && data.data.records) {
                totalCreated += data.data.records.length;
            } else {
                console.error('[SLS_LOG] batchCreateLarkRecords: Lỗi logic từ API Batch Create:', data);
                allErrors.push({ code: data.code, msg: data.msg, chunkIndex: i/CHUNK_SIZE, response: data });
            }
        } catch (error: any) {
            console.error('[SLS_LOG] batchCreateLarkRecords: Lỗi mạng khi tạo lô:', error.message);
            allErrors.push({ error: error.message, chunkIndex: i/CHUNK_SIZE });
        }
        if (recordsToCreate.length > CHUNK_SIZE && i + CHUNK_SIZE < recordsToCreate.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay
        }
    }
    return { success: allErrors.length === 0, createdCount: totalCreated, errors: allErrors };
}

// --- HÀM GỬI DỮ LIỆU LÊN LARK (CẬP NHẬT) ---
interface RecordToUpdate {
    record_id: string;
    fields: Record<string, any>;
}
async function batchUpdateLarkRecords(accessToken: string, recordsToUpdate: RecordToUpdate[]): Promise<{success: boolean, updatedCount: number, errors: any[]}> {
    console.log(`[SLS_LOG] batchUpdateLarkRecords: Bắt đầu cập nhật ${recordsToUpdate.length} bản ghi...`);
    if (!recordsToUpdate || recordsToUpdate.length === 0) return { success: true, updatedCount: 0, errors: [] };

    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_BASE_APP_TOKEN}/tables/${LARK_TABLE_ID}/records/batch_update`;
    let totalUpdated = 0;
    const allErrors: any[] = [];

    const CHUNK_SIZE = 450; // Lark API limit
    for (let i = 0; i < recordsToUpdate.length; i += CHUNK_SIZE) {
        const chunk = recordsToUpdate.slice(i, i + CHUNK_SIZE);
         console.log(`[SLS_LOG] batchUpdateLarkRecords: Đang cập nhật lô ${Math.floor(i/CHUNK_SIZE)+1}, kích thước: ${chunk.length}`);
        try {
            const response: FetchResponse = await fetch(url, { /* ... request options ... */
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ records: chunk }), // API batch_update cũng dùng key "records"
            });
            const responseText = await response.text();
            if (!response.ok) {
                console.error(`[SLS_LOG] batchUpdateLarkRecords: Lỗi HTTP ${response.status} khi cập nhật lô:`, responseText);
                allErrors.push({ status: response.status, text: responseText, chunkIndex: i/CHUNK_SIZE });
                continue;
            }
            const data: any = JSON.parse(responseText);
            if (data.code === 0 && data.data && data.data.records) {
                totalUpdated += data.data.records.length; // API trả về các bản ghi đã được cập nhật
            } else {
                console.error('[SLS_LOG] batchUpdateLarkRecords: Lỗi logic từ API Batch Update:', data);
                allErrors.push({ code: data.code, msg: data.msg, chunkIndex: i/CHUNK_SIZE, response: data });
            }
        } catch (error: any) {
            console.error('[SLS_LOG] batchUpdateLarkRecords: Lỗi mạng khi cập nhật lô:', error.message);
            allErrors.push({ error: error.message, chunkIndex: i/CHUNK_SIZE });
        }
        if (recordsToUpdate.length > CHUNK_SIZE && i + CHUNK_SIZE < recordsToUpdate.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay
        }
    }
    return { success: allErrors.length === 0, updatedCount: totalUpdated, errors: allErrors };
}


// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    const allowedOrigin = process.env.ALLOWED_CORS_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    if (req.method === 'OPTIONS') {
        console.log('[SLS_LOG] Handler: OPTIONS request (preflight).');
        return res.status(200).end();
    }

    console.log('[SLS_LOG] Handler: Bắt đầu quá trình UPSERT dữ liệu từ Web Demo POST...');
    if (req.method !== 'POST') { /* ... (kiểm tra method) ... */
        console.warn(`[SLS_LOG] Handler: Phương thức không hợp lệ: ${req.method}`);
        res.setHeader('Allow', ['POST', 'OPTIONS']); // Thông báo các method được phép
        return res.status(405).json({ success: false, message: 'Method Not Allowed, please use POST.' });
    }

    const webDemoPayload = req.body;
    if (!webDemoPayload || !webDemoPayload.rawOrderData || !Array.isArray(webDemoPayload.rawOrderData)) { /* ... (kiểm tra payload) ... */
        console.error('[SLS_LOG] Handler: Dữ liệu không hợp lệ. Thiếu "rawOrderData". Body:', webDemoPayload);
        return res.status(400).json({ success: false, message: 'Invalid payload. Expecting { "rawOrderData": [...] }.' });
    }

    const webDemoData = webDemoPayload.rawOrderData as any[];
    console.log(`[SLS_LOG] Handler: Nhận được ${webDemoData.length} bản ghi từ Web Demo.`);
    if (webDemoData.length === 0) {
        return res.status(200).json({ success: true, message: 'Không có dữ liệu từ Web Demo để đồng bộ.' });
    }

    try {
        const larkAccessToken = await getLarkTenantAccessToken();
        if (!larkAccessToken) {
            return res.status(500).json({ success: false, message: 'Không thể lấy Lark access token.' });
        }
        console.log('[SLS_LOG] Handler: Đã lấy Lark Access Token.');

        // 1. Lấy tất cả bản ghi hiện có từ Lark
        const existingLarkRecordsMap = await getAllExistingLarkRecords(larkAccessToken);
        if (existingLarkRecordsMap === null) {
            return res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu hiện có từ Lark Base.' });
        }

        const recordsToCreate: Array<{ fields: Record<string, any> }> = [];
        const recordsToUpdate: RecordToUpdate[] = [];

        // 2. Xử lý và so sánh dữ liệu
        for (const webRecordArray of webDemoData) {
            const webFields = transformDataForLarkRecord(webRecordArray); // Chuyển đổi dữ liệu từ web demo
            if (!webFields) continue; // Bỏ qua nếu dữ liệu web không hợp lệ

            const webOrderNumber = String(webFields[LARK_COL_ORDER_NUMBER]).trim();
            const existingLarkRecord = webOrderNumber ? existingLarkRecordsMap[webOrderNumber] : undefined;

            if (existingLarkRecord) {
                // Đơn hàng đã tồn tại -> Kiểm tra xem có cần cập nhật không
                const fieldsToPotentiallyUpdate: Record<string, any> = {};
                let needsUpdate = false;

                // So sánh Status Order
                const webStatus = String(webFields[LARK_COL_STATUS_ORDER]);
                const larkStatus = String(existingLarkRecord.fields[LARK_COL_STATUS_ORDER]);
                if (webStatus !== larkStatus) {
                    fieldsToPotentiallyUpdate[LARK_COL_STATUS_ORDER] = webStatus;
                    needsUpdate = true;
                }

                // So sánh Cancellation Fee
                // Cần cẩn thận khi so sánh giá trị tiền tệ (có thể đã được format)
                // Nên so sánh giá trị gốc nếu có, hoặc đảm bảo format nhất quán
                const webCancelFee = webFields[LARK_COL_CANCEL_FEE]; // Đã qua formatCurrency
                const larkCancelFee = formatCurrency(existingLarkRecord.fields[LARK_COL_CANCEL_FEE]); // Format lại để so sánh
                if (webCancelFee !== larkCancelFee) {
                    fieldsToPotentiallyUpdate[LARK_COL_CANCEL_FEE] = webCancelFee; // Gửi giá trị đã format từ web
                    needsUpdate = true;
                }
                
                // (TÙY CHỌN) Cập nhật các trường khác nếu đơn hàng đã tồn tại
                // Ví dụ: luôn cập nhật Guest Name, Phone nếu có thay đổi
                // const fieldsToAlwaysUpdateIfChanged = [LARK_COL_GUEST_NAME, LARK_COL_PHONE, ...];
                // for (const fieldKey of fieldsToAlwaysUpdateIfChanged) {
                //     if (webFields[fieldKey] !== existingLarkRecord.fields[fieldKey]) {
                //        fieldsToPotentiallyUpdate[fieldKey] = webFields[fieldKey];
                //        needsUpdate = true;
                //     }
                // }


                if (needsUpdate && Object.keys(fieldsToPotentiallyUpdate).length > 0) {
                    recordsToUpdate.push({
                        record_id: existingLarkRecord.record_id,
                        fields: fieldsToPotentiallyUpdate,
                    });
                    if (recordsToUpdate.length < 3) {
                        console.log(`[SLS_LOG] Handler: Chuẩn bị cập nhật Order#${webOrderNumber}, RecordID: ${existingLarkRecord.record_id}, Fields:`, fieldsToPotentiallyUpdate);
                    }
                }
            } else if (webOrderNumber) {
                // Đơn hàng chưa có -> Thêm mới (gửi tất cả các trường đã transform)
                recordsToCreate.push({ fields: webFields });
                 if (recordsToCreate.length < 3) {
                    console.log(`[SLS_LOG] Handler: Chuẩn bị tạo mới Order#${webOrderNumber}, Fields:`, webFields);
                }
            }
        }

        console.log(`[SLS_LOG] Handler: Số bản ghi cần tạo mới: ${recordsToCreate.length}`);
        console.log(`[SLS_LOG] Handler: Số bản ghi cần cập nhật: ${recordsToUpdate.length}`);

        let overallSuccess = true;
        let messages: string[] = [];

        // 3. Thực hiện tạo mới
        if (recordsToCreate.length > 0) {
            const createResult = await batchCreateLarkRecords(larkAccessToken, recordsToCreate);
            messages.push(`Tạo mới: ${createResult.createdCount} bản ghi thành công.`);
            if (!createResult.success) {
                overallSuccess = false;
                messages.push(`Lỗi khi tạo mới: ${createResult.errors.length} lô bị lỗi.`);
                console.error("[SLS_LOG] Handler: Lỗi chi tiết khi tạo mới:", JSON.stringify(createResult.errors, null, 2));
            }
        }

        // 4. Thực hiện cập nhật
        if (recordsToUpdate.length > 0) {
            const updateResult = await batchUpdateLarkRecords(larkAccessToken, recordsToUpdate);
            messages.push(`Cập nhật: ${updateResult.updatedCount} bản ghi thành công.`);
            if (!updateResult.success) {
                overallSuccess = false;
                messages.push(`Lỗi khi cập nhật: ${updateResult.errors.length} lô bị lỗi.`);
                console.error("[SLS_LOG] Handler: Lỗi chi tiết khi cập nhật:", JSON.stringify(updateResult.errors, null, 2));
            }
        }
        
        // (Tùy chọn) Xóa các bản ghi không còn tồn tại trong webDemoData
        // const webDemoOrderNumbers = new Set(webDemoData.map(el => String(el[0] || '').trim()).filter(Boolean));
        // const recordsToDelete: string[] = [];
        // for (const larkOrderNum in existingLarkRecordsMap) {
        //     if (!webDemoOrderNumbers.has(larkOrderNum)) {
        //         recordsToDelete.push(existingLarkRecordsMap[larkOrderNum].record_id);
        //     }
        // }
        // if (recordsToDelete.length > 0) {
        //     console.log(`[SLS_LOG] Handler: Sẽ xóa ${recordsToDelete.length} bản ghi không còn trong dữ liệu nguồn.`);
        //     // Gọi hàm batchDeleteLarkRecords(larkAccessToken, recordsToDelete);
        //     // Xử lý kết quả xóa
        // }


        if (overallSuccess) {
            return res.status(200).json({ success: true, message: messages.join(' ') || "Không có thay đổi nào cần thực hiện." });
        } else {
            return res.status(207).json({ success: false, message: `Đồng bộ một phần. ${messages.join(' ')}. Kiểm tra logs để biết chi tiết.` });
        }

    } catch (e: any) {
        console.error("[SLS_LOG] Handler: LỖI KHÔNG XÁC ĐỊNH:", e.message, e.stack);
        return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi không mong muốn trên máy chủ.', error: e.message });
    }
}
