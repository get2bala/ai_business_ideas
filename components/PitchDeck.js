import React, { useState } from 'react';

// Sample themes
const themes = {
  modern: {
    primary: '#2563eb',
    secondary: '#1e40af',
    background: '#f8fafc',
    text: '#1e293b',
    accent: '#3b82f6',
    fontFamily: "'Inter', sans-serif",
  },
  classic: {
    primary: '#334155',
    secondary: '#475569',
    background: '#ffffff',
    text: '#0f172a',
    accent: '#64748b',
    fontFamily: "'Georgia', serif",
  },
  minimal: {
    primary: '#18181b',
    secondary: '#27272a',
    background: '#fafafa',
    text: '#09090b',
    accent: '#52525b',
    fontFamily: "'Helvetica', sans-serif",
  },
  bold: {
    primary: '#dc2626',
    secondary: '#991b1b',
    background: '#fef2f2',
    text: '#450a0a',
    accent: '#ef4444',
    fontFamily: "'Montserrat', sans-serif",
  },
  nature: {
    primary: '#15803d',
    secondary: '#166534',
    background: '#f0fdf4',
    text: '#14532d',
    accent: '#22c55e',
    fontFamily: "'Roboto', sans-serif",
  },
  dark: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    background: '#0f172a',
    text: '#f8fafc',
    accent: '#94a3b8',
    fontFamily: "'SF Pro Display', sans-serif",
  }
};

// Sample pitch deck data
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
        ],
        diagrams: ["Platform Overview", "Verification Process"]
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
  ],
  metadata: {
    last_updated: "2025-08-31",
    generated_by: "gemini",
    template_version: "1.0"
  }
};

const PitchDeck = () => {
  const [currentTheme, setCurrentTheme] = useState('modern');
  const [deck, setDeck] = useState(samplePitchDeck);
  
  const renderSlide = (slide, theme) => {
    const slideStyle = {
      minHeight: '500px',
      padding: '2rem',
      margin: '1rem 0',
      borderRadius: '8px',
      backgroundColor: themes[theme].background,
      color: themes[theme].text,
      fontFamily: themes[theme].fontFamily,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    };

    switch (slide.type) {
      case 'title':
        return (
          <div style={slideStyle} className="flex flex-col items-center justify-center text-center">
            <h1 style={{ color: themes[theme].primary, fontSize: '2.5rem', marginBottom: '1rem' }}>
              {slide.content.title}
            </h1>
            <h2 style={{ color: themes[theme].secondary, fontSize: '1.5rem' }}>
              {slide.content.subtitle}
            </h2>
          </div>
        );

      case 'problem':
        return (
          <div style={slideStyle}>
            <h2 style={{ color: themes[theme].primary, fontSize: '2rem', marginBottom: '1.5rem' }}>
              {slide.content.title}
            </h2>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {slide.content.points.map((point, index) => (
                <li 
                  key={index}
                  style={{ 
                    marginBottom: '1rem',
                    paddingLeft: '1.5rem',
                    position: 'relative'
                  }}
                >
                  <span style={{ 
                    position: 'absolute',
                    left: 0,
                    color: themes[theme].accent
                  }}>•</span>
                  {point}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '2rem', color: themes[theme].secondary }}>
              {Object.entries(slide.content.statistics).map(([key, value]) => (
                <p key={key} style={{ marginBottom: '0.5rem' }}>
                  <strong>{key}:</strong> {value}
                </p>
              ))}
            </div>
          </div>
        );

      case 'solution':
        return (
          <div style={slideStyle}>
            <h2 style={{ color: themes[theme].primary, fontSize: '2rem', marginBottom: '1.5rem' }}>
              Solution
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
              {slide.content.value_proposition}
            </p>
            <h3 style={{ color: themes[theme].secondary, marginBottom: '1rem' }}>
              Key Features
            </h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {slide.content.key_features.map((feature, index) => (
                <li 
                  key={index}
                  style={{ 
                    marginBottom: '0.75rem',
                    paddingLeft: '1.5rem',
                    position: 'relative'
                  }}
                >
                  <span style={{ 
                    position: 'absolute',
                    left: 0,
                    color: themes[theme].accent
                  }}>→</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'market':
        return (
          <div style={slideStyle}>
            <h2 style={{ color: themes[theme].primary, fontSize: '2rem', marginBottom: '1.5rem' }}>
              Market Opportunity
            </h2>
            <div style={{ 
              fontSize: '1.5rem', 
              color: themes[theme].accent,
              textAlign: 'center',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              {slide.content.market_size}
            </div>
            <div>
              <h3 style={{ color: themes[theme].secondary, marginBottom: '1rem' }}>
                Target Segments
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {slide.content.target_segments.map((segment, index) => (
                  <li 
                    key={index}
                    style={{ 
                      marginBottom: '0.75rem',
                      paddingLeft: '1.5rem',
                      position: 'relative'
                    }}
                  >
                    <span style={{ 
                      position: 'absolute',
                      left: 0,
                      color: themes[theme].accent
                    }}>•</span>
                    {segment}
                  </li>
                ))}
              </ul>
            </div>
            <p style={{ 
              marginTop: '2rem',
              color: themes[theme].secondary,
              fontStyle: 'italic'
            }}>
              {slide.content.growth_potential}
            </p>
          </div>
        );

      case 'business_model':
        return (
          <div style={slideStyle}>
            <h2 style={{ color: themes[theme].primary, fontSize: '2rem', marginBottom: '1.5rem' }}>
              Business Model
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ color: themes[theme].secondary, marginBottom: '1rem' }}>
                  Revenue Streams
                </h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {slide.content.revenue_streams.map((stream, index) => (
                    <li 
                      key={index}
                      style={{ 
                        marginBottom: '0.75rem',
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}
                    >
                      <span style={{ 
                        position: 'absolute',
                        left: 0,
                        color: themes[theme].accent
                      }}>$</span>
                      {stream}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ color: themes[theme].secondary, marginBottom: '1rem' }}>
                  Cost Structure
                </h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {slide.content.cost_structure.map((cost, index) => (
                    <li 
                      key={index}
                      style={{ 
                        marginBottom: '0.75rem',
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}
                    >
                      <span style={{ 
                        position: 'absolute',
                        left: 0,
                        color: themes[theme].accent
                      }}>-</span>
                      {cost}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: themes[currentTheme].background,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <label style={{ marginRight: '1rem', color: themes[currentTheme].text }}>
          Select Theme:
        </label>
        <select 
          value={currentTheme}
          onChange={(e) => setCurrentTheme(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: `1px solid ${themes[currentTheme].accent}`,
            backgroundColor: themes[currentTheme].background,
            color: themes[currentTheme].text
          }}
        >
          {Object.keys(themes).map(theme => (
            <option key={theme} value={theme}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {deck.slides.map((slide, index) => (
          <div key={index}>
            {renderSlide(slide, currentTheme)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PitchDeck;
