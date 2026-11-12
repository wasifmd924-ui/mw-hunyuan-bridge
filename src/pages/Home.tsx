import { Converter } from '../components/Converter';
import { Hero } from '../components/Hero';

interface HomeProps {
  onHowItWorks: () => void;
}

export function Home({ onHowItWorks }: HomeProps) {
  const scrollToConverter = () => {
    const el = document.getElementById('converter-workspace');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <Hero onStartConverting={scrollToConverter} onHowItWorks={onHowItWorks} />
      <Converter />
    </div>
  );
}

