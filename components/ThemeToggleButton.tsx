
"use client"
import { useTheme } from 'next-themes'
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react';

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant='outline' size="icon">
        <Sun />
      </Button>
    );
  }

  return (
    <Button
      variant='secondary'
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}

export default ThemeToggleButton