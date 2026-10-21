export { LogoutModal, type LogoutModalProps } from '../LogoutModal';
export default function LogoutModalWrapper(props: import('../LogoutModal').LogoutModalProps) {
  const { LogoutModal } = require('../LogoutModal');
  return <LogoutModal {...props} />;
}
