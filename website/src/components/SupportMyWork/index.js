import React from 'react'
import styles from './styles.module.css'

const SITE = 'https://cryptoc-app.web.app'
const IOS = 'https://apps.apple.com/app/cryptoc/id1333169178'
const PLAY = 'https://play.google.com/store/apps/details?id=co.ssoul.CryptoC'

export default function SupportMyWork() {
  return (
    <aside className={styles.band}>
      <div className={styles.inner}>
        <div className={styles.aside}>
          <a href={SITE}>
            <img className={styles.icon} src={`${SITE}/img/icon.png`} alt="cryptoc app icon" width={72} height={72} />
          </a>
          <img className={styles.qr} src={`${SITE}/img/qr-get.png`} alt="QR code that installs cryptoc" width={118} height={118} />
          <span className={styles.scan}>Scan to install</span>
          <div className={styles.badges}>
            <a href={IOS}>
              <img className={styles.badgeIos} src={`${SITE}/img/appstore.svg`} alt="Download on the App Store" />
            </a>
            <a href={PLAY}>
              <img className={styles.badgePlay} src={`${SITE}/img/googleplay.png`} alt="Get it on Google Play" />
            </a>
          </div>
        </div>

        <div className={styles.body}>
          <h2>Support my work</h2>
          <p>
            <a href={SITE}><strong>cryptoc</strong></a> is my crypto portfolio app. Your coins on the
            home screen, lock screen and watch face - iPhone, iPad, Mac, Apple Watch, Android,
            Android tablet and Wear OS.
          </p>
          <ul>
            <li>Portfolio with average buy price and 24h / 180-day / all-time P&amp;L</li>
            <li>Widgets in three sizes, refreshed in the background - most days you never open the app</li>
            <li>Price alerts on 5,000+ coins, delivered while the app is closed</li>
            <li><strong>No account, no email, no exchange API keys, no ads.</strong> Your holdings never reach a server - they sync through your own iCloud or Google Drive</li>
            <li>Free for 3 holdings, and that is not a trial timer</li>
          </ul>
          <p className={styles.note}>Downloading it is what pays for the time that goes into these libraries.</p>
        </div>
      </div>
    </aside>
  )
}
