/**
 * Mock face/physiognomy analysis — entertainment only.
 */
export async function mockFaceAnalysis(_uri: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 900));

  const paragraphs = [
    '✦ Phân tích tướng số (mô phỏng AI)',
    '',
    'Khuôn mặt tổng thể gợi ấn tượng điềm đạm và có chiều sâu. Tỷ lệ trán – mũi – cằm cân đối, thường gắn với khả năng quan sát tinh tế và quyết định có cân nhắc.',
    '',
    'Trán: Vùng trán rộng vừa phải, liên hệ với tư duy logic và khả năng lập kế hoạch. Giai đoạn này phù hợp học hỏi kỹ năng mới hoặc sắp xếp lại mục tiêu dài hạn.',
    '',
    'Mắt: Ánh mắt có độ tập trung ổn định. Trong tương số dân gian, kiểu này thường gắn với trung thành trong quan hệ và kiên trì khi theo đuổi việc khó.',
    '',
    'Mũi: Sống mũi rõ, gợi ý năng lượng tài chính “giữ được của”. Nên ưu tiên tích lũy đều đặn hơn là mạo hiểm lớn trong thời gian tới.',
    '',
    'Miệng & cằm: Đường cười mềm mại kết hợp cằm vững cho thấy bạn dễ được tin tưởng, phù hợp vai trò kết nối hoặc hỗ trợ nhóm.',
    '',
    'Lời khuyên giải trí: Giữ thói quen ngủ đúng giờ và tiếp xúc ánh sáng ban ngày — “khí sắc” sẽ phản ánh rõ trên khuôn mặt.',
    '',
    '— Van Su AI · Chỉ mang tính giải trí, không phải lời khuyên chuyên môn —',
  ];

  return paragraphs.join('\n');
}
