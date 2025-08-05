// Uncomment this line to use CSS modules
// import styles from './app.module.scss';

import { Routes, Route } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';

export function App() {
  return (
    <Routes>
      <Route path="/:patientUuid" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
