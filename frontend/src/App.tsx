import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ContactListPage } from './components/ContactList/ContactListPage';
import { ContactDetailPage } from './components/ContactDetail/ContactDetailPage';
import { Users } from 'lucide-react';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="app-layout">
          {/* Top Navigation Bar */}
          <header className="app-navbar">
            <div className="navbar-container">
              <Link to="/" className="navbar-brand">
                <div className="brand-icon">
                  <Users size={20} />
                </div>
                <div className="brand-text">
                  <span className="brand-title">CRM Contact Workspace</span>
                  <span className="brand-subtitle">Contact Management</span>
                </div>
              </Link>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="app-main">
            <Routes>
              <Route path="/" element={<ContactListPage />} />
              <Route path="/contacts/:id" element={<ContactDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="app-footer">
            <p>CRM Contact Workspace • Built with React 19, TypeScript, Express & SQLite</p>
          </footer>
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
