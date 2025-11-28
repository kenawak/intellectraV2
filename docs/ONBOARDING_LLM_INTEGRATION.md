# Onboarding Data Integration with LLM Intelligence Engine

## Overview

The onboarding system captures user market specialization data that is used to contextualize AI-generated insights, reports, and recommendations. This document explains how the specialization data is integrated into the LLM system instructions.

## Data Structure

When a user completes onboarding, the following data is persisted to the `userprofile` table:

```typescript
{
  marketSpecialization: string;      // e.g., "Fullstack" or "CAD Design"
  specializationPath: string[];     // e.g., ['Digital', 'Software_Development', 'Web_Development', 'Fullstack']
  onboardingComplete: boolean;       // true
}
```

## Dynamic System Instruction Construction

### Example Implementation

When generating a deep search report or performing market analysis, the system dynamically constructs a specialized system instruction using the user's `specializationPath`.

#### Base System Instruction Template

```typescript
const baseInstruction = `You are a highly specialized Market Analyst for Intellectra. 
Your primary expertise is in the {DOMAIN} domain, specifically {CATEGORY} and {SUBCATEGORY} technologies. 
Filter all search results and analysis through the lens of this specialization, 
focusing on actionable advice and trends relevant to this niche.`;
```

#### Dynamic Construction Function

```typescript
/**
 * Constructs a specialized system instruction based on user's market specialization path
 * 
 * @param specializationPath - Array of strings representing the user's specialization hierarchy
 * @returns Formatted system instruction string
 */
function buildSpecializedSystemInstruction(specializationPath: string[]): string {
  if (!specializationPath || specializationPath.length === 0) {
    // Fallback to generic instruction
    return `You are a Market Analyst for Intellectra. Provide comprehensive market insights and analysis.`;
  }

  // Extract key levels from the path
  const domain = specializationPath[0] || 'General';
  const category = specializationPath[1] || '';
  const subcategory = specializationPath[2] || '';
  const specialization = specializationPath[specializationPath.length - 1] || '';

  // Build context-aware instruction
  let instruction = `You are a highly specialized Market Analyst for Intellectra.\n\n`;
  instruction += `**Primary Expertise:**\n`;
  instruction += `- Domain: ${domain}\n`;
  
  if (category) {
    instruction += `- Category: ${category.replace(/_/g, ' ')}\n`;
  }
  
  if (subcategory) {
    instruction += `- Subcategory: ${subcategory.replace(/_/g, ' ')}\n`;
  }
  
  if (specialization && specialization !== subcategory) {
    instruction += `- Specialization: ${specialization.replace(/_/g, ' ')}\n`;
  }

  instruction += `\n**Analysis Guidelines:**\n`;
  instruction += `1. Filter all search results and analysis through the lens of this specialization.\n`;
  instruction += `2. Focus on actionable advice and trends relevant to ${specialization.replace(/_/g, ' ')} professionals.\n`;
  instruction += `3. Prioritize insights that are directly applicable to this niche market.\n`;
  instruction += `4. Highlight opportunities, pain points, and emerging trends specific to this domain.\n`;
  instruction += `5. Provide context-aware recommendations that align with ${domain} industry standards.\n`;

  return instruction;
}
```

### Example Output

#### Input:
```typescript
specializationPath: ['Digital', 'Software_Development', 'Web_Development', 'Fullstack']
```

#### Generated System Instruction:
```
You are a highly specialized Market Analyst for Intellectra.

**Primary Expertise:**
- Domain: Digital
- Category: Software Development
- Subcategory: Web Development
- Specialization: Fullstack

**Analysis Guidelines:**
1. Filter all search results and analysis through the lens of this specialization.
2. Focus on actionable advice and trends relevant to Fullstack professionals.
3. Prioritize insights that are directly applicable to this niche market.
4. Highlight opportunities, pain points, and emerging trends specific to this domain.
5. Provide context-aware recommendations that align with Digital industry standards.
```

## Integration Points

### 1. Deep Search Report Generation

**Location:** `/api/reports/generate` (to be implemented)

```typescript
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session?.user.id;

  // Fetch user's specialization data
  const profile = await db
    .select({ specializationPath: userprofile.specializationPath })
    .from(userprofile)
    .where(eq(userprofile.userId, userId))
    .limit(1);

  const specializationPath = profile[0]?.specializationPath || [];
  
  // Build specialized system instruction
  const systemInstruction = buildSpecializedSystemInstruction(specializationPath);

  // Use in LLM prompt
  const prompt = `
    ${systemInstruction}
    
    Analyze the following search results and generate a comprehensive market report:
    ${searchResults}
  `;

  // Generate report with specialized context
  const report = await generateReport(prompt);
  return NextResponse.json({ report });
}
```

### 2. Idea Generation Enhancement

**Location:** `/api/ideas/generate`

```typescript
// In generateIdeas function
const profile = await db
  .select({ 
    specializationPath: userprofile.specializationPath,
    marketSpecialization: userprofile.marketSpecialization 
  })
  .from(userprofile)
  .where(eq(userprofile.userId, userId))
  .limit(1);

if (profile[0]?.specializationPath) {
  const specializedContext = buildSpecializedSystemInstruction(profile[0].specializationPath);
  
  // Enhance the idea generation prompt with specialization context
  const enhancedPrompt = `
    ${specializedContext}
    
    Generate developer side project ideas that are particularly relevant to ${profile[0].marketSpecialization} professionals.
    Focus on problems and opportunities within this specialization.
    
    Query: ${query}
  `;
}
```

### 3. Competitive Analysis

**Location:** `/api/analysis/competitive` (to be implemented)

```typescript
// When analyzing competitors, use specialization to filter and prioritize
const systemInstruction = buildSpecializedSystemInstruction(specializationPath);

const analysisPrompt = `
  ${systemInstruction}
  
  Analyze competitors in the ${marketSpecialization} space.
  Identify trends, gaps, and opportunities specific to this niche.
`;
```

## Benefits

1. **Personalized Insights:** All AI-generated content is filtered through the user's specialization lens
2. **Relevant Recommendations:** Ideas and reports are tailored to the user's domain expertise
3. **Context-Aware Analysis:** Market trends are analyzed with domain-specific knowledge
4. **Improved User Experience:** Users receive more actionable, relevant information

## Future Enhancements

1. **Multi-Specialization Support:** Allow users to select multiple specializations
2. **Specialization Updates:** Allow users to update their specialization as their focus changes
3. **Specialization-Based Filtering:** Filter public ideas and reports by specialization
4. **Specialization Analytics:** Track which specializations generate the most valuable insights

## Testing

To test the integration:

1. Complete onboarding with a specific specialization path
2. Generate a deep search report
3. Verify that the report content is filtered through the specialization lens
4. Check that recommendations are relevant to the selected specialization

## Example Use Cases

### Use Case 1: Fullstack Developer
- **Path:** `['Digital', 'Software_Development', 'Web_Development', 'Fullstack']`
- **Focus:** Full-stack web development trends, frameworks, and opportunities
- **Reports:** Emphasize both frontend and backend technologies, full-stack tooling, and integrated solutions

### Use Case 2: CAD Design Professional
- **Path:** `['Physical', 'Product Design', '3D Modeling', 'CAD Design']`
- **Focus:** CAD software trends, manufacturing processes, and design tools
- **Reports:** Highlight CAD software updates, manufacturing innovations, and design workflow improvements

### Use Case 3: Digital Marketing Specialist
- **Path:** `['Services', 'Marketing', 'Digital_Marketing', 'SEO']`
- **Focus:** SEO trends, algorithm updates, and digital marketing tools
- **Reports:** Emphasize SEO strategies, content marketing trends, and marketing automation tools

