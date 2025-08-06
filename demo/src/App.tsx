import { ConfigProvider } from './contexts/ConfigContext'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App