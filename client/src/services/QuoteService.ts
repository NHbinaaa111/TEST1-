class QuoteServiceClass {
  private quotes = [
    { text: "The hardest battle you'll ever have to fight is between what you know and what you feel.", author: "C.V. Raman" },
    { text: "Don't wait until everything is just right. It will never be perfect. There will always be challenges, obstacles, and less than perfect conditions. Get started now.", author: "H. Jackson Brown Jr." },
    { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "The best way to predict your future is to create it.", author: "Abraham Lincoln" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Success consists of going from failure to failure without loss of enthusiasm.", author: "Winston Churchill" },
    { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" }
  ];

  private getLocalStorage<T>(key: string, initialValue: T): T {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error retrieving from localStorage', error);
      return initialValue;
    }
  }

  private setLocalStorage<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  getCurrentQuoteIndex(): number {
    return this.getLocalStorage('chadjee_current_quote_index', 0);
  }

  getCurrentQuote(): { text: string; author: string } {
    const index = this.getCurrentQuoteIndex();
    return this.quotes[index];
  }

  getNextQuote(): { text: string; author: string } {
    const currentIndex = this.getCurrentQuoteIndex();
    const nextIndex = (currentIndex + 1) % this.quotes.length;
    
    this.setLocalStorage('chadjee_current_quote_index', nextIndex);
    
    return this.quotes[nextIndex];
  }

  getRandomQuote(): { text: string; author: string } {
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    this.setLocalStorage('chadjee_current_quote_index', randomIndex);
    return this.quotes[randomIndex];
  }
}

export const QuoteService = new QuoteServiceClass();
