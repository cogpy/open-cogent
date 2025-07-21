import * as styles from './auth-layout.css';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.root}>
      <img src="/logo.svg" alt="Open Agent" className={styles.logo} />
      {children}
    </div>
  );
};
