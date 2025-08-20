import styles from './styles/SamplePage.module.scss';

export const SamplePage: React.FC = () => {
  return (
    <div className={styles.head}>
      <h1>Sample Page</h1>
      <p>This is a sample page in the Bahmni Sample app.</p>
    </div>
  );
};
