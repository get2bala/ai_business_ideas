const themes = {
  modern: {
    primary: '#2563eb',
    secondary: '#1e40af',
    background: '#ffffff',
    text: '#1e293b',
    accent: '#3b82f6',
    primaryRgb: '37, 99, 235',
    accentRgb: '59, 130, 246',
    fontDisplay: "'Playfair Display', serif",
    fontBody: "'Plus Jakarta Sans', sans-serif"
  },
  dark: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    background: '#0f172a',
    text: '#f8fafc',
    accent: '#60a5fa',
    primaryRgb: '226, 232, 240',
    accentRgb: '96, 165, 250',
    fontDisplay: "'Playfair Display', serif",
    fontBody: "'Plus Jakarta Sans', sans-serif"
  },
  minimal: {
    primary: '#18181b',
    secondary: '#27272a',
    background: '#fafafa',
    text: '#09090b',
    accent: '#52525b',
    primaryRgb: '24, 24, 27',
    accentRgb: '82, 82, 91',
    fontDisplay: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif"
  },
  impact: {
    primary: '#dc2626',
    secondary: '#991b1b',
    background: '#fef2f2',
    text: '#450a0a',
    accent: '#ef4444',
    primaryRgb: '220, 38, 38',
    accentRgb: '239, 68, 68',
    fontDisplay: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif"
  },
  elegant: {
    primary: '#334155',
    secondary: '#475569',
    background: '#ffffff',
    text: '#0f172a',
    accent: '#64748b',
    primaryRgb: '51, 65, 85',
    accentRgb: '100, 116, 139',
    fontDisplay: "'Playfair Display', serif",
    fontBody: "'Plus Jakarta Sans', sans-serif"
  },
  tech: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    background: '#0f172a',
    text: '#f8fafc',
    accent: '#60a5fa',
    primaryRgb: '59, 130, 246',
    accentRgb: '96, 165, 250',
    fontDisplay: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif"
  }
};

const samplePitchDeck = {
  version: "1.0",
  theme: "modern",
  slides: [
    {
      type: "title",
      content: {
        title: "EcoTravel",
        subtitle: "Transforming Tourism for a Sustainable Future"
      }
    },
    {
      type: "problem",
      content: {
        title: "The Challenge",
        points: [
          "70% of travelers struggle to find authentic eco-friendly options",
          "Lack of transparency in sustainability claims",
          "Fragmented booking experience for conscious travelers"
        ],
        statistics: {
          "Global Impact": "Tourism contributes 8% of global emissions",
          "Market Gap": "89% of travelers seek sustainable options",
          "Growth": "Sustainable tourism growing at 15% annually"
        }
      }
    },
    {
      type: "solution",
      content: {
        value_proposition: "A revolutionary platform connecting conscious travelers with verified sustainable experiences",
        key_features: [
          "AI-Powered Sustainability Scoring",
          "Real-time Carbon Footprint Tracking",
          "Verified Local Community Partnerships",
          "Blockchain-based Certification System"
        ],
        diagrams: ["platform-overview.svg", "verification-process.svg"]
      }
    },
    {
      type: "market",
      content: {
        market_size: "$800B Global Sustainable Tourism Market",
        target_segments: [
          "Eco-Conscious Millennials & Gen-Z",
          "Luxury Sustainable Travelers",
          "Corporate ESG Programs"
        ],
        growth_potential: "Projected to Reach $1.3T by 2030"
      }
    },
    {
      type: "team",
      content: {
        title: "World-Class Team",
        members: [
          {
            name: "Dr. Sarah Chen",
            role: "CEO & Founder",
            bio: "Former Head of Sustainability at Airbnb, PhD in Environmental Science",
            photo_url: "sarah-chen.jpg"
          },
          {
            name: "Marcus Rodriguez",
            role: "CTO",
            bio: "Ex-Google AI Lead, Built Sustainable Supply Chain Solutions",
            photo_url: "marcus-rodriguez.jpg"
          }
        ],
        advisors: [
          "Former UN Sustainable Tourism Director",
          "Tesla Sustainability Board Member",
          "Leading Climate Tech VC Partner"
        ],
        why_us: "Combined 50+ years in sustainable tourism and technology"
      }
    },
    {
      type: "roadmap",
      content: {
        title: "Path to Impact",
        milestones: [
          {
            date: "Q4 2025",
            title: "Platform Launch",
            description: "Initial release in major European markets"
          },
          {
            date: "Q2 2026",
            title: "AI Integration",
            description: "Advanced sustainability scoring system"
          },
          {
            date: "Q4 2026",
            title: "Global Expansion",
            description: "Launch in APAC and Americas"
          }
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
  document.documentElement.style.setProperty('--primary-color-rgb', theme.primaryRgb);
  document.documentElement.style.setProperty('--accent-color-rgb', theme.accentRgb);
  document.documentElement.style.setProperty('--font-display', theme.fontDisplay);
  document.documentElement.style.setProperty('--font-body', theme.fontBody);
}

function createSlideHTML(slide, index) {
  const slideNumber = `<div class="slide-number">${String(index + 1).padStart(2, '0')}</div>`;
  
  switch(slide.type) {
    case 'title':
      return `
        <div class="slide title-slide">
          ${slideNumber}
          <div class="content">
            <h1>${slide.content.title}</h1>
            <h2>${slide.content.subtitle}</h2>
          </div>
        </div>
      `;
    
    case 'problem':
      return `
        <div class="slide problem-slide">
          ${slideNumber}
          <div class="content">
            <h2>${slide.content.title}</h2>
            <ul class="point-list">
              ${slide.content.points.map(point => `<li>${point}</li>`).join('')}
            </ul>
            <div class="statistics">
              ${Object.entries(slide.content.statistics)
                .map(([key, value]) => `
                  <div class="stat-item">
                    <div class="stat-key">${key}</div>
                    <div class="stat-value">${value}</div>
                  </div>
                `).join('')}
            </div>
          </div>
        </div>
      `;
    
    case 'solution':
      return `
        <div class="slide solution-slide">
          ${slideNumber}
          <div class="content">
            <h2>Our Solution</h2>
            <p class="value-prop">${slide.content.value_proposition}</p>
            <div class="features-grid">
              ${slide.content.key_features.map(feature => `
                <div class="feature-card">
                  <span class="feature-icon">↗</span>
                  <span class="feature-text">${feature}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    
    case 'market':
      return `
        <div class="slide market-slide">
          ${slideNumber}
          <div class="content">
            <h2>Market Opportunity</h2>
            <div class="market-size">${slide.content.market_size}</div>
            <div class="segments-grid">
              ${slide.content.target_segments.map(segment => `
                <div class="segment-card">
                  <span class="segment-text">${segment}</span>
                </div>
              `).join('')}
            </div>
            <p class="growth-potential">${slide.content.growth_potential}</p>
          </div>
        </div>
      `;
    
    case 'team':
      return `
        <div class="slide team-slide">
          ${slideNumber}
          <div class="content">
            <h2>${slide.content.title}</h2>
            <div class="team-grid">
              ${slide.content.members.map(member => `
                <div class="team-member">
                  <div class="member-photo" style="background-image: url(${member.photo_url})"></div>
                  <h3>${member.name}</h3>
                  <h4>${member.role}</h4>
                  <p>${member.bio}</p>
                </div>
              `).join('')}
            </div>
            <div class="advisors">
              <h3>Advisors</h3>
              <div class="advisors-list">
                ${slide.content.advisors.map(advisor => `
                  <div class="advisor-card">${advisor}</div>
                `).join('')}
              </div>
            </div>
            <p class="why-us">${slide.content.why_us}</p>
          </div>
        </div>
      `;
    
    case 'roadmap':
      return `
        <div class="slide roadmap-slide">
          ${slideNumber}
          <div class="content">
            <h2>${slide.content.title}</h2>
            <div class="timeline">
              ${slide.content.milestones.map((milestone, i) => `
                <div class="milestone ${i % 2 === 0 ? 'left' : 'right'}">
                  <div class="milestone-content">
                    <h3>${milestone.date}</h3>
                    <h4>${milestone.title}</h4>
                    <p>${milestone.description}</p>
                  </div>
                </div>
              `).join('')}
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
  slidesContainer.innerHTML = deck.slides.map((slide, index) => createSlideHTML(slide, index)).join('');
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
