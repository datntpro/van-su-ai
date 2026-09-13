/** Map start_trial_if_eligible RPC errors to Vietnamese UI copy. */
export function mapTrialRpcError(message: string | undefined | null): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('not authenticated')) return 'Bạn cần đăng nhập tài khoản cloud để bắt đầu trial.';
  if (m.includes('birth_date required'))
    return 'Vui lòng hoàn tất ngày sinh trước khi bắt đầu Trial Pro 7 ngày.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Không thể kết nối để bắt đầu trial. Kiểm tra mạng rồi thử lại.';
  if (m.includes('jwt') || m.includes('session'))
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử lại trial.';
  if (!message) return 'Không thể bắt đầu trial. Vui lòng thử lại.';
  return `Không thể bắt đầu trial: ${message}`;
}
