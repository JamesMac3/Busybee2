import { BuilderProvider } from './builderStore.jsx';
import Header from './components/Header.jsx';
import Builder from './components/Builder.jsx';
import Company from './components/Company.jsx';
import MobileStepBar from './components/MobileStepBar.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <BuilderProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div id="top" />
      <Header />
      <main id="main">
        <Builder />
        <Company />
      </main>
      <Footer />
      <MobileStepBar />
    </BuilderProvider>
  );
}
