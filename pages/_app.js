import '../styles/globals.css'
import '../styles/components.css'
import NotificationSystem from '../components/NotificationSystem'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <NotificationSystem />
    </>
  )
}