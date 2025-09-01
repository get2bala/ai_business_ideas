# Automatic Pitch Deck Creation

## Overview
Generate professional pitch decks automatically using Gemini AI, leveraging idea data from the platform.

## Database Structure
The pitch_deck table currently supports:
- Basic pitch deck metadata (id, created_at, created_by)
- Link to idea (idea_id)
- Slides content (slides jsonb)

### Slides JSONB Structure
The `slides` JSONB field should contain:
```json
{
  "version": "1.0",
  "theme": "modern|classic|minimal",
  "slides": [
    {
      "type": "title",
      "content": {
        "title": "Main title",
        "subtitle": "Subtitle text"
      }
    },
    {
      "type": "problem",
      "content": {
        "title": "Problem Statement",
        "points": ["point1", "point2"],
        "statistics": {}
      }
    },
    {
      "type": "solution",
      "content": {
        "value_proposition": "",
        "key_features": [],
        "diagrams": []
      }
    },
    {
      "type": "market",
      "content": {
        "market_size": "",
        "target_segments": [],
        "growth_potential": ""
      }
    },
    {
      "type": "business_model",
      "content": {
        "revenue_streams": [],
        "pricing_strategy": "",
        "cost_structure": []
      }
    },
    {
      "type": "team",
      "content": {
        "title": "Our Team",
        "members": [
          {
            "name": "Founder Name",
            "role": "Role",
            "bio": "Brief highlights of uniqueness and strengths (e.g., 'PhD in AI, led teams at FAANG, 3 patents')",
            "photo_url": "optional_url"
          }
        ],
        "advisors": ["Advisor highlights"],
        "why_us": "Unique team strengths summary (e.g., 'Combined 50+ years in industry with proven execution')"
      }
    },
    {
      "type": "roadmap",
      "content": {
        "milestones": [],
        "timeline": {}
      }
    }
  ],
  "metadata": {
    "last_updated": "timestamp",
    "generated_by": "gemini",
    "template_version": "1.0"
  }
}
```

## Implementation Approach

### Backend Components
1. **Pitch Deck Service (`services/pitch-deck.js`)**
   - Handle pitch deck CRUD operations with Supabase
   - Integrate with Gemini AI for content generation
   - Manage slide template selection and customization

2. **Gemini Integration (`services/gemini-integration.js`)**
   - Connect to Gemini API
   - Process idea data into structured pitch deck content
   - Generate compelling copy for each slide section

3. **Template Engine (`services/template-engine.js`)**
   - Manage slide templates and themes
   - Handle slide structure and formatting
   - Support custom template creation

### Flow
1. User requests pitch deck generation for an idea
2. Backend fetches idea data (title, summary, details) from ideas table
3. Gemini API processes idea data to generate structured content
4. Content is organized into slide templates
5. Generated pitch deck is saved to pitch_deck table
6. User can view, edit, and export the deck

### API Endpoints
```javascript
// New endpoints to be added:
POST /api/pitch-decks/generate
GET /api/pitch-decks/:id
PUT /api/pitch-decks/:id
DELETE /api/pitch-decks/:id
GET /api/pitch-decks/by-idea/:ideaId
POST /api/pitch-decks/:id/export
```

## Integration Plan
- Add a "Generate Pitch Deck" button to each idea card/modal
- Implement progress indicator for generation process
- Add pitch deck viewer/editor component
- Support multiple export formats (PDF, PPTX, Images)
- Enable template customization for premium users

## Future Enhancements
1. AI-powered image suggestions for slides
2. Industry-specific templates
3. Collaborative editing features
4. Version control for pitch decks
5. Analytics on pitch deck performance
