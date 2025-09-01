const themes = {
  modern: {
    primary: '#2563eb',
    secondary: '#1e40af',
    background: '#f8fafc',
    text: '#1e293b',
    accent: '#3b82f6',
    fontFamily: "'Inter', sans-serif"
  },
  classic: {
    primary: '#334155',
    secondary: '#475569',
    background: '#ffffff',
    text: '#0f172a',
    accent: '#64748b',
    fontFamily: "'Georgia', serif"
  },
  minimal: {
    primary: '#18181b',
    secondary: '#27272a',
    background: '#fafafa',
    text: '#09090b',
    accent: '#52525b',
    fontFamily: "'Helvetica', sans-serif"
  },
  bold: {
    primary: '#dc2626',
    secondary: '#991b1b',
    background: '#fef2f2',
    text: '#450a0a',
    accent: '#ef4444',
    fontFamily: "'Montserrat', sans-serif"
  },
  nature: {
    primary: '#15803d',
    secondary: '#166534',
    background: '#f0fdf4',
    text: '#14532d',
    accent: '#22c55e',
    fontFamily: "'Roboto', sans-serif"
  },
  dark: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    background: '#0f172a',
    text: '#f8fafc',
    accent: '#94a3b8',
    fontFamily: "'SF Pro Display', sans-serif"
  }
};

const samplePitchDeck = {
  version: "1.0",
  theme: "modern",
  slides: [
    {
      type: "title",
      content: {
        title: "EcoTravel: Sustainable Tourism Platform",
        subtitle: "Making Travel Environmentally Conscious"
      }
    },
    {
      type: "problem",
      content: {
        title: "The Problem",
        points: [
          "70% of travelers want sustainable options but struggle to find them",
          "Lack of transparency in eco-friendly accommodations",
          "Difficult to verify environmental claims"
        ],
        statistics: {
          carbonImpact: "Tourism accounts for 8% of global emissions",
          growthRate: "Sustainable tourism growing 15% yearly"
        }
      }
    },
    {
      type: "solution",
      content: {
        value_proposition: "A comprehensive platform connecting eco-conscious travelers with verified sustainable accommodations and experiences",
        key_features: [
          "AI-powered sustainability scoring",
          "Carbon footprint tracking",
          "Local community integration",
          "Verified eco-certifications"
        ]
      }
    },
    {
      type: "market",
      content: {
        market_size: "$800B Global Sustainable Tourism Market",
        target_segments: [
          "Environmentally conscious millennials",
          "Luxury eco-travelers",
          "Corporate sustainable travel programs"
        ],
        growth_potential: "Expected to reach $1.3T by 2030"
      }
    },
    {
      type: "business_model",
      content: {
        revenue_streams: [
          "15% commission on bookings",
          "Premium verification services",
          "Sustainability consulting"
        ],
        pricing_strategy: "Freemium model with premium features",
        cost_structure: [
          "Platform development and maintenance",
          "Verification process",
          "Marketing and customer acquisition"
        ]
      }
    }
  ]
};

function applyTheme(themeName) {
  const theme = themes[themeName];
  document.documentElement.style.setProperty('--primary-color', theme.primary);
  document.documentElement.style.setProperty('--secondary-color', theme.secondary);
  document.documentElement.style.setProperty('--background-color', theme.background);
  document.documentElement.style.setProperty('--text-color', theme.text);
  document.documentElement.style.setProperty('--accent-color', theme.accent);
  document.documentElement.style.setProperty('--font-family', theme.fontFamily);
}

function createSlideHTML(slide) {
  switch(slide.type) {
    case 'title':
      return `
        <div class="slide title-slide">
          <h1>${slide.content.title}</h1>
          <h2>${slide.content.subtitle}</h2>
        </div>
      `;
    
    case 'problem':
      return `
        <div class="slide problem-slide">
          <h2>${slide.content.title}</h2>
          <ul class="point-list">
            ${slide.content.points.map(point => `<li>${point}</li>`).join('')}
          </ul>
          <div class="statistics">
            ${Object.entries(slide.content.statistics)
              .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
              .join('')}
          </div>
        </div>
      `;
    
    case 'solution':
      return `
        <div class="slide solution-slide">
          <h2>Solution</h2>
          <p style="font-size: 1.2rem; margin-bottom: 2rem;">
            ${slide.content.value_proposition}
          </p>
          <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
            Key Features
          </h3>
          <ul class="point-list">
            ${slide.content.key_features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      `;
    
    case 'market':
      return `
        <div class="slide market-slide">
          <h2>Market Opportunity</h2>
          <div class="market-size">
            ${slide.content.market_size}
          </div>
          <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
            Target Segments
          </h3>
          <ul class="point-list">
            ${slide.content.target_segments.map(segment => `<li>${segment}</li>`).join('')}
          </ul>
          <p class="growth-potential">
            ${slide.content.growth_potential}
          </p>
        </div>
      `;
    
    case 'business_model':
      return `
        <div class="slide business-model-slide">
          <h2>Business Model</h2>
          <div class="business-model-grid">
            <div>
              <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
                Revenue Streams
              </h3>
              <ul class="point-list">
                ${slide.content.revenue_streams.map(stream => `<li>${stream}</li>`).join('')}
              </ul>
            </div>
            <div>
              <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
                Cost Structure
              </h3>
              <ul class="point-list">
                ${slide.content.cost_structure.map(cost => `<li>${cost}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    
    default:
      return '';
  }
}

function renderPitchDeck(deck) {
  const slidesContainer = document.getElementById('slides-container');
  slidesContainer.innerHTML = deck.slides.map(slide => createSlideHTML(slide)).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial theme application
  applyTheme(samplePitchDeck.theme);
  
  // Render the pitch deck
  renderPitchDeck(samplePitchDeck);
  
  // Theme selector event listener
  const themeSelector = document.getElementById('theme-selector');
  themeSelector.addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });
});
