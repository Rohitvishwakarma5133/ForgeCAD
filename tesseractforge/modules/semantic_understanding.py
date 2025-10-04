#!/usr/bin/env python3
"""
🔥 SEMANTIC UNDERSTANDING MODULE
================================

Advanced AI-powered semantic analysis for converting raw OCR/symbol data 
into structured engineering information:

✅ GPT-4 Vision semantic analysis
✅ Claude AI structural understanding  
✅ Technical specification extraction
✅ Component identification & classification
✅ Design intent recognition
✅ Standards compliance analysis

For Engineering Drawing Intelligence & Automation
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Tuple
import time
import re

# AI API clients
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

class SemanticUnderstandingEngine:
    """🔥 Advanced Semantic Analysis Engine"""
    
    def __init__(self):
        """Initialize semantic understanding engine with AI models"""
        print("🚀 INITIALIZING SEMANTIC UNDERSTANDING ENGINE")
        print("=" * 60)
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize AI clients
        self.ai_clients = {}
        self._initialize_ai_clients()
        
        # Engineering knowledge base
        self.engineering_patterns = self._load_engineering_patterns()
        
        # Processing statistics
        self.processing_stats = {
            'total_analyses': 0,
            'successful_extractions': 0,
            'ai_api_calls': 0,
            'average_processing_time': 0.0
        }
        
        print("🎯 SEMANTIC UNDERSTANDING ENGINE READY!")
        print("=" * 60)
    
    def _load_config(self) -> Dict[str, Any]:
        """Load AI configuration from environment"""
        return {
            'openai': {
                'api_key': os.getenv('OPENAI_API_KEY'),
                'model': os.getenv('OPENAI_MODEL', 'gpt-4o'),
                'max_tokens': int(os.getenv('OPENAI_MAX_TOKENS', '4000')),
                'temperature': float(os.getenv('OPENAI_TEMPERATURE', '0.2'))
            },
            'claude': {
                'api_key': os.getenv('CLAUDE_API_KEY'),
                'model': os.getenv('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
                'max_tokens': int(os.getenv('CLAUDE_MAX_TOKENS', '4000'))
            }
        }
    
    def _initialize_ai_clients(self):
        """Initialize AI clients with error handling"""
        # OpenAI GPT-4
        if OPENAI_AVAILABLE and self.config['openai']['api_key']:
            try:
                self.ai_clients['openai'] = openai.OpenAI(
                    api_key=self.config['openai']['api_key']
                )
                print("✅ OpenAI GPT-4 Client - READY")
            except Exception as e:
                print(f"❌ OpenAI initialization failed: {e}")
        else:
            print("⚠️ OpenAI not configured")
        
        # Claude AI
        if ANTHROPIC_AVAILABLE and self.config['claude']['api_key']:
            try:
                self.ai_clients['claude'] = anthropic.Anthropic(
                    api_key=self.config['claude']['api_key']
                )
                print("✅ Claude AI Client - READY")
            except Exception as e:
                print(f"❌ Claude initialization failed: {e}")
        else:
            print("⚠️ Claude not configured")
    
    def _load_engineering_patterns(self) -> Dict[str, Any]:
        """Load engineering knowledge patterns for better analysis"""
        return {
            'measurement_units': [
                'mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mil', 'μm', 'nm',
                '°', '°C', '°F', 'K', 'rad', 'sr', 'Hz', 'kHz', 'MHz', 'GHz',
                'N', 'kN', 'lbf', 'Pa', 'kPa', 'MPa', 'GPa', 'psi', 'bar',
                'kg', 'g', 'lb', 'oz', 'ton', 'tonne'
            ],
            
            'tolerance_indicators': [
                '±', '∓', '+/-', 'MAX', 'MIN', 'NOM', 'TYP', 'REF',
                'H7', 'H8', 'h7', 'h8', 'H6', 'h6', 'IT6', 'IT7', 'IT8'
            ],
            
            'drawing_standards': [
                'ISO', 'ANSI', 'ASME', 'DIN', 'JIS', 'BS', 'ASTM',
                'Y14.5', 'ISO 14405', 'ISO 2768', 'ISO 286'
            ],
            
            'material_specifications': [
                'STEEL', 'ALUMINUM', 'BRASS', 'COPPER', 'TITANIUM', 'PLASTIC',
                'STAINLESS', 'CARBON', 'ALLOY', 'SS316', 'SS304', 'AL6061',
                'AL7075', 'BRASS360', 'TI6AL4V'
            ],
            
            'geometric_symbols': [
                'Ø', '∅', 'R', 'SR', '□', '△', '○', '◇', '⌖', '⊥', '∥',
                '∠', '⌒', '⌐', '≈', '≡', '≤', '≥', '∞'
            ],
            
            'process_indicators': [
                'MACHINED', 'CAST', 'FORGED', 'WELDED', 'BRAZED', 'SOLDERED',
                'HEAT TREAT', 'ANODIZED', 'PLATED', 'PAINTED', 'FINISHED'
            ]
        }
    
    async def analyze_with_gpt4(self, analysis_data: Dict[str, Any], 
                               context: str = "") -> Dict[str, Any]:
        """Advanced semantic analysis using GPT-4"""
        if 'openai' not in self.ai_clients:
            return {'error': 'OpenAI client not available', 'status': 'failed'}
        
        try:
            start_time = time.time()
            
            # Prepare comprehensive analysis prompt
            prompt = self._create_gpt4_analysis_prompt(analysis_data, context)
            
            response = self.ai_clients['openai'].chat.completions.create(
                model=self.config['openai']['model'],
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert engineering analyst specializing in technical drawing interpretation and CAD analysis. You have deep knowledge of:
- Engineering drawing standards (ISO, ANSI, ASME)
- Geometric dimensioning & tolerancing (GD&T)
- Manufacturing processes and materials
- Technical documentation standards
- Component design and functionality

Analyze the provided technical data and extract structured engineering information with high precision and professional insight."""
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=self.config['openai']['max_tokens'],
                temperature=self.config['openai']['temperature']
            )
            
            processing_time = time.time() - start_time
            content = response.choices[0].message.content
            
            # Parse structured response
            structured_analysis = self._parse_gpt4_response(content)
            
            return {
                'status': 'success',
                'processing_time': processing_time,
                'tokens_used': response.usage.total_tokens if response.usage else 0,
                'model': self.config['openai']['model'],
                'analysis': structured_analysis,
                'raw_response': content,
                'confidence': self._calculate_confidence(structured_analysis)
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'processing_time': time.time() - start_time if 'start_time' in locals() else 0
            }
    
    async def analyze_with_claude(self, analysis_data: Dict[str, Any], 
                                 context: str = "") -> Dict[str, Any]:
        """Structural understanding using Claude AI"""
        if 'claude' not in self.ai_clients:
            return {'error': 'Claude client not available', 'status': 'failed'}
        
        try:
            start_time = time.time()
            
            # Create Claude-specific analysis prompt
            prompt = self._create_claude_analysis_prompt(analysis_data, context)
            
            response = self.ai_clients['claude'].messages.create(
                model=self.config['claude']['model'],
                max_tokens=self.config['claude']['max_tokens'],
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            processing_time = time.time() - start_time
            content = response.content[0].text if response.content else ""
            
            # Parse structured response
            structured_analysis = self._parse_claude_response(content)
            
            return {
                'status': 'success',
                'processing_time': processing_time,
                'tokens_used': (response.usage.input_tokens + response.usage.output_tokens) if hasattr(response, 'usage') else 0,
                'model': self.config['claude']['model'],
                'analysis': structured_analysis,
                'raw_response': content,
                'confidence': self._calculate_confidence(structured_analysis)
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'processing_time': time.time() - start_time if 'start_time' in locals() else 0
            }
    
    def _create_gpt4_analysis_prompt(self, data: Dict[str, Any], context: str) -> str:
        """Create comprehensive GPT-4 analysis prompt"""
        
        # Extract available data
        ocr_text = self._extract_text_content(data)
        symbols_detected = self._extract_symbol_data(data)
        geometric_data = self._extract_geometric_data(data)
        
        prompt = f"""As an expert engineering analyst, analyze this technical drawing data and provide structured engineering insights:

## INPUT DATA SUMMARY:
**OCR Text Extracted:** {len(ocr_text)} text elements found
**Symbols Detected:** {symbols_detected.get('total_symbols', 0)} engineering symbols
**Geometric Elements:** {geometric_data.get('total_elements', 0)} shapes and lines
**Context:** {context if context else 'Technical drawing analysis'}

## OCR TEXT CONTENT:
{self._format_text_for_analysis(ocr_text)}

## DETECTED SYMBOLS:
{self._format_symbols_for_analysis(symbols_detected)}

## GEOMETRIC ELEMENTS:
{self._format_geometric_for_analysis(geometric_data)}

## ANALYSIS REQUIRED:
Please provide a comprehensive structured analysis in JSON format with these sections:

1. **COMPONENT_IDENTIFICATION**:
   - component_type: (e.g., "mechanical_part", "assembly", "schematic")
   - component_name: Descriptive name
   - primary_function: Main purpose/function
   - complexity_level: "simple", "medium", "complex"

2. **TECHNICAL_SPECIFICATIONS**:
   - dimensions: {{key: value}} extracted measurements
   - tolerances: List of tolerance specifications
   - materials: Identified material specifications
   - surface_finishes: Surface treatment requirements
   - geometric_features: Key geometric characteristics

3. **MANUFACTURING_INFO**:
   - manufacturing_processes: Suggested/required processes
   - machining_requirements: Specific machining notes
   - assembly_instructions: Assembly-related information
   - quality_standards: Referenced quality/inspection standards

4. **DRAWING_METADATA**:
   - drawing_standard: (ISO, ANSI, etc.)
   - scale: Drawing scale if indicated
   - revision: Revision information
   - title_block_info: Title block data
   - part_number: Part/drawing number

5. **DESIGN_INTENT**:
   - functional_requirements: What this component must do
   - critical_dimensions: Most important measurements
   - design_considerations: Engineering design notes
   - performance_requirements: Performance specifications

6. **RECOMMENDATIONS**:
   - manufacturing_suggestions: Manufacturing optimization
   - design_improvements: Potential design enhancements
   - missing_information: What additional info would be helpful
   - compliance_notes: Standards compliance observations

Return ONLY valid JSON with these exact section names. Ensure all values are properly quoted strings or appropriate data types."""
        
        return prompt
    
    def _create_claude_analysis_prompt(self, data: Dict[str, Any], context: str) -> str:
        """Create Claude-specific structural analysis prompt"""
        
        ocr_text = self._extract_text_content(data)
        symbols_detected = self._extract_symbol_data(data)
        geometric_data = self._extract_geometric_data(data)
        
        prompt = f"""I need you to perform expert-level structural analysis of this technical drawing data. Focus on understanding the engineering design and extracting actionable technical information.

## RAW DATA INPUT:

### Text Content Extracted:
{self._format_text_for_analysis(ocr_text)}

### Symbol Analysis:
{self._format_symbols_for_analysis(symbols_detected)}

### Geometric Analysis:
{self._format_geometric_for_analysis(geometric_data)}

### Context:
{context if context else 'Technical drawing structural analysis'}

## REQUIRED ANALYSIS:

Please provide comprehensive structural understanding organized as follows:

**STRUCTURAL CLASSIFICATION:**
- What type of engineering document is this?
- What category of component/system does it represent?
- What is the primary engineering discipline involved?

**TECHNICAL CONTENT EXTRACTION:**
- Extract all dimensional information with units
- Identify tolerance specifications and their applications
- List material specifications and requirements
- Note any standard references (ISO, ANSI, ASTM, etc.)

**FUNCTIONAL ANALYSIS:**
- What is the primary function of this component/assembly?
- What are the key functional requirements?
- How do the geometric features support the function?
- What are the critical performance characteristics?

**MANUFACTURING INTELLIGENCE:**
- What manufacturing processes are implied or specified?
- What are the key manufacturing considerations?
- What quality control measures are indicated?
- Are there any special processing requirements?

**DESIGN ASSESSMENT:**
- How would you assess the design complexity?
- What are the most critical aspects of this design?
- Are there any potential design issues or improvements?
- How well does the documentation support manufacturing?

**STRUCTURED DATA RECOMMENDATIONS:**
- What key data should be extracted for database storage?
- How should this information be categorized for retrieval?
- What metadata would be most valuable for this drawing type?

Provide detailed, professional engineering analysis with specific examples from the data where possible. Focus on actionable insights that would be valuable for engineering teams, manufacturers, and quality assurance."""
        
        return prompt
    
    def _extract_text_content(self, data: Dict[str, Any]) -> List[str]:
        """Extract all text content from analysis data"""
        text_content = []
        
        # From OCR results
        ocr_results = data.get('ocr_results', {})
        for api_name, result in ocr_results.items():
            if result.get('status') == 'success':
                result_data = result.get('data', {})
                
                # Handle different OCR result formats
                if 'analysis' in result_data:
                    text_content.append(result_data['analysis'])
                elif 'full_text' in result_data:
                    text_content.append(result_data['full_text'])
                elif 'extracted_text' in result_data:
                    text_content.append(result_data['extracted_text'])
                elif 'text' in result_data:
                    text_content.append(result_data['text'])
        
        # From symbol analysis text annotations
        symbol_results = data.get('symbol_results', {})
        if 'annotations' in symbol_results:
            text_annotations = symbol_results['annotations'].get('text_annotations', [])
            for annotation in text_annotations:
                if 'text' in annotation:
                    text_content.append(annotation['text'])
        
        return [text for text in text_content if text and isinstance(text, str)]
    
    def _extract_symbol_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract symbol detection data"""
        symbol_data = {
            'total_symbols': 0,
            'geometric_shapes': {},
            'dimensions': [],
            'annotations': {}
        }
        
        symbol_results = data.get('symbol_results', {})
        if symbol_results:
            # Geometric shapes
            shapes = symbol_results.get('analysis_results', {}).get('geometric_shapes', {})
            symbol_data['geometric_shapes'] = shapes
            symbol_data['total_symbols'] += shapes.get('total_shapes', 0)
            
            # Annotations and dimensions
            annotations = symbol_results.get('analysis_results', {}).get('annotations', {})
            symbol_data['annotations'] = annotations
            symbol_data['total_symbols'] += annotations.get('summary', {}).get('total_dimension_lines', 0)
        
        return symbol_data
    
    def _extract_geometric_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract geometric analysis data"""
        geometric_data = {'total_elements': 0, 'shapes': {}, 'lines': []}
        
        symbol_results = data.get('symbol_results', {})
        if symbol_results and 'analysis_results' in symbol_results:
            shapes = symbol_results['analysis_results'].get('geometric_shapes', {})
            geometric_data['shapes'] = shapes
            geometric_data['total_elements'] = shapes.get('total_shapes', 0)
            geometric_data['lines'] = shapes.get('lines', [])
        
        return geometric_data
    
    def _format_text_for_analysis(self, text_content: List[str]) -> str:
        """Format text content for AI analysis"""
        if not text_content:
            return "No text content detected"
        
        formatted_texts = []
        for i, text in enumerate(text_content[:10], 1):  # Limit to first 10 texts
            # Clean and truncate text
            clean_text = text.strip()[:200]  # Limit length
            formatted_texts.append(f"{i}. {clean_text}")
        
        return "\n".join(formatted_texts)
    
    def _format_symbols_for_analysis(self, symbols: Dict[str, Any]) -> str:
        """Format symbol data for AI analysis"""
        if symbols.get('total_symbols', 0) == 0:
            return "No symbols detected"
        
        format_parts = []
        
        # Geometric shapes summary
        shapes = symbols.get('geometric_shapes', {})
        if shapes:
            format_parts.append(f"Total shapes: {shapes.get('total_shapes', 0)}")
            if shapes.get('circles'):
                format_parts.append(f"Circles: {len(shapes['circles'])}")
            if shapes.get('rectangles'):
                format_parts.append(f"Rectangles: {len(shapes['rectangles'])}")
            if shapes.get('lines'):
                format_parts.append(f"Lines: {len(shapes['lines'])}")
        
        # Annotations summary
        annotations = symbols.get('annotations', {})
        if annotations:
            summary = annotations.get('summary', {})
            if summary.get('total_dimension_lines', 0) > 0:
                format_parts.append(f"Dimension lines: {summary['total_dimension_lines']}")
            if summary.get('total_arrows', 0) > 0:
                format_parts.append(f"Arrows: {summary['total_arrows']}")
        
        return "; ".join(format_parts) if format_parts else "Symbol data available but not formatted"
    
    def _format_geometric_for_analysis(self, geometric: Dict[str, Any]) -> str:
        """Format geometric data for AI analysis"""
        if geometric.get('total_elements', 0) == 0:
            return "No geometric elements detected"
        
        format_parts = [f"Total elements: {geometric['total_elements']}"]
        
        shapes = geometric.get('shapes', {})
        if shapes:
            for shape_type, shape_list in shapes.items():
                if isinstance(shape_list, list) and shape_list:
                    format_parts.append(f"{shape_type}: {len(shape_list)}")
        
        return "; ".join(format_parts)
    
    def _parse_gpt4_response(self, content: str) -> Dict[str, Any]:
        """Parse GPT-4 JSON response with error handling"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'{.*}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback: create structured response from text
                return self._create_fallback_structure(content, 'gpt4')
        except json.JSONDecodeError:
            return self._create_fallback_structure(content, 'gpt4')
    
    def _parse_claude_response(self, content: str) -> Dict[str, Any]:
        """Parse Claude response into structured format"""
        try:
            # Try to find JSON in response
            json_match = re.search(r'{.*}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Parse structured text response
                return self._parse_claude_structured_text(content)
        except:
            return self._create_fallback_structure(content, 'claude')
    
    def _parse_claude_structured_text(self, content: str) -> Dict[str, Any]:
        """Parse Claude's structured text response"""
        structured = {
            'structural_classification': {},
            'technical_content': {},
            'functional_analysis': {},
            'manufacturing_intelligence': {},
            'design_assessment': {},
            'recommendations': {}
        }
        
        # Extract sections based on Claude's typical response structure
        sections = content.split('**')
        current_section = None
        
        for section in sections:
            section = section.strip()
            if 'STRUCTURAL CLASSIFICATION' in section.upper():
                current_section = 'structural_classification'
            elif 'TECHNICAL CONTENT' in section.upper():
                current_section = 'technical_content'
            elif 'FUNCTIONAL ANALYSIS' in section.upper():
                current_section = 'functional_analysis'
            elif 'MANUFACTURING INTELLIGENCE' in section.upper():
                current_section = 'manufacturing_intelligence'
            elif 'DESIGN ASSESSMENT' in section.upper():
                current_section = 'design_assessment'
            elif 'RECOMMENDATIONS' in section.upper():
                current_section = 'recommendations'
            elif current_section and section:
                structured[current_section]['content'] = section[:500]  # Limit length
        
        return structured
    
    def _create_fallback_structure(self, content: str, source: str) -> Dict[str, Any]:
        """Create fallback structured response when JSON parsing fails"""
        return {
            'fallback_response': True,
            'source': source,
            'raw_content': content[:1000],  # Truncate for storage
            'extracted_insights': self._extract_key_insights(content),
            'status': 'parsed_as_text'
        }
    
    def _extract_key_insights(self, content: str) -> List[str]:
        """Extract key insights from unstructured text"""
        insights = []
        
        # Look for measurement patterns
        measurement_pattern = r'\d+\.?\d*\s*(?:mm|cm|m|in|ft|°|±)'
        measurements = re.findall(measurement_pattern, content, re.IGNORECASE)
        if measurements:
            insights.append(f"Measurements found: {', '.join(measurements[:5])}")
        
        # Look for material references
        for material in self.engineering_patterns['material_specifications']:
            if material.lower() in content.lower():
                insights.append(f"Material reference: {material}")
                break
        
        # Look for standards references
        for standard in self.engineering_patterns['drawing_standards']:
            if standard in content:
                insights.append(f"Standard reference: {standard}")
                break
        
        return insights
    
    def _calculate_confidence(self, analysis: Dict[str, Any]) -> float:
        """Calculate confidence score for the analysis"""
        if analysis.get('fallback_response'):
            return 0.3
        
        confidence_factors = []
        
        # Check for structured sections
        if isinstance(analysis, dict):
            section_count = len([k for k, v in analysis.items() if v])
            confidence_factors.append(min(section_count / 6.0, 1.0))  # Max 6 expected sections
            
            # Check for specific technical content
            technical_indicators = 0
            content_str = str(analysis).lower()
            
            if any(unit in content_str for unit in self.engineering_patterns['measurement_units'][:10]):
                technical_indicators += 1
            if any(std in content_str for std in self.engineering_patterns['drawing_standards'][:5]):
                technical_indicators += 1
            if any(mat in content_str for mat in self.engineering_patterns['material_specifications'][:10]):
                technical_indicators += 1
            
            confidence_factors.append(technical_indicators / 3.0)
        
        return sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.5
    
    async def comprehensive_semantic_analysis(self, analysis_data: Dict[str, Any], 
                                            context: str = "") -> Dict[str, Any]:
        """🔥 COMPREHENSIVE SEMANTIC ANALYSIS"""
        
        print("🔥 COMPREHENSIVE SEMANTIC ANALYSIS")
        print("=" * 60)
        
        start_time = time.time()
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'input_data_summary': self._generate_input_summary(analysis_data),
            'ai_analyses': {},
            'consolidated_insights': {},
            'performance_metrics': {}
        }
        
        # Run parallel AI analyses
        ai_tasks = []
        
        if 'openai' in self.ai_clients:
            print("🤖 Queuing GPT-4 semantic analysis...")
            ai_tasks.append(('gpt4', self.analyze_with_gpt4(analysis_data, context)))
        
        if 'claude' in self.ai_clients:
            print("🤖 Queuing Claude structural analysis...")
            ai_tasks.append(('claude', self.analyze_with_claude(analysis_data, context)))
        
        # Execute AI analyses
        if ai_tasks:
            print("⚡ Running AI analyses concurrently...")
            ai_results = await asyncio.gather(*[task[1] for task in ai_tasks], return_exceptions=True)
            
            for i, (ai_name, _) in enumerate(ai_tasks):
                result = ai_results[i]
                if isinstance(result, Exception):
                    results['ai_analyses'][ai_name] = {
                        'status': 'error',
                        'error': str(result)
                    }
                    print(f"   ❌ {ai_name.upper()}: Failed")
                else:
                    results['ai_analyses'][ai_name] = result
                    if result.get('status') == 'success':
                        processing_time = result.get('processing_time', 0)
                        tokens = result.get('tokens_used', 0)
                        print(f"   ✅ {ai_name.upper()}: Success in {processing_time:.1f}s ({tokens} tokens)")
                    else:
                        print(f"   ❌ {ai_name.upper()}: Failed")
        
        # Consolidate insights from all AI analyses
        print("🔍 Consolidating insights...")
        results['consolidated_insights'] = self._consolidate_ai_insights(results['ai_analyses'])
        
        # Generate performance metrics
        total_time = time.time() - start_time
        successful_analyses = sum(1 for result in results['ai_analyses'].values() 
                                 if result.get('status') == 'success')
        
        results['performance_metrics'] = {
            'total_processing_time': total_time,
            'successful_ai_analyses': successful_analyses,
            'total_ai_analyses': len(results['ai_analyses']),
            'success_rate': (successful_analyses / len(results['ai_analyses'])) * 100 if results['ai_analyses'] else 0,
            'average_confidence': self._calculate_average_confidence(results['ai_analyses']),
            'total_tokens_used': sum(result.get('tokens_used', 0) for result in results['ai_analyses'].values())
        }
        
        # Update processing statistics
        self.processing_stats['total_analyses'] += 1
        if successful_analyses > 0:
            self.processing_stats['successful_extractions'] += 1
        self.processing_stats['ai_api_calls'] += len(results['ai_analyses'])
        
        print("🎉 SEMANTIC ANALYSIS COMPLETE!")
        print(f"⚡ Processing Time: {total_time:.2f}s")
        print(f"🧠 AI Success Rate: {results['performance_metrics']['success_rate']:.0f}%")
        print(f"🎯 Average Confidence: {results['performance_metrics']['average_confidence']:.0%}")
        print("=" * 60)
        
        return results
    
    def _generate_input_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of input data for analysis"""
        return {
            'ocr_sources': len(data.get('ocr_results', {})),
            'symbol_analysis_available': 'symbol_results' in data,
            'text_elements': len(self._extract_text_content(data)),
            'symbols_detected': self._extract_symbol_data(data).get('total_symbols', 0),
            'geometric_elements': self._extract_geometric_data(data).get('total_elements', 0)
        }
    
    def _consolidate_ai_insights(self, ai_analyses: Dict[str, Any]) -> Dict[str, Any]:
        """Consolidate insights from multiple AI analyses"""
        consolidated = {
            'component_analysis': {},
            'technical_specifications': {},
            'manufacturing_insights': {},
            'design_assessment': {},
            'consensus_findings': {},
            'conflicting_interpretations': []
        }
        
        successful_analyses = [result for result in ai_analyses.values() 
                              if result.get('status') == 'success']
        
        if not successful_analyses:
            consolidated['status'] = 'no_successful_analyses'
            return consolidated
        
        # Extract common findings
        for analysis in successful_analyses:
            analysis_data = analysis.get('analysis', {})
            
            # Component identification
            if 'component_type' in str(analysis_data):
                consolidated['component_analysis']['identified'] = True
            
            # Technical specifications
            if any(keyword in str(analysis_data).lower() for keyword in ['dimension', 'tolerance', 'material']):
                consolidated['technical_specifications']['found'] = True
            
            # Manufacturing information
            if any(keyword in str(analysis_data).lower() for keyword in ['manufacturing', 'machining', 'process']):
                consolidated['manufacturing_insights']['found'] = True
        
        # Generate consensus findings
        consolidated['consensus_findings'] = {
            'analysis_agreement': len(successful_analyses) > 1,
            'confidence_level': self._calculate_average_confidence(ai_analyses),
            'key_insights': self._extract_consensus_insights(successful_analyses)
        }
        
        return consolidated
    
    def _extract_consensus_insights(self, analyses: List[Dict[str, Any]]) -> List[str]:
        """Extract insights that appear across multiple analyses"""
        insights = []
        
        # Combine all analysis content
        all_content = []
        for analysis in analyses:
            content = str(analysis.get('analysis', ''))
            all_content.append(content.lower())
        
        # Look for common technical terms
        common_terms = []
        for term in ['dimension', 'tolerance', 'material', 'manufacturing', 'assembly', 'specification']:
            if sum(1 for content in all_content if term in content) >= len(all_content) // 2:
                common_terms.append(term)
        
        if common_terms:
            insights.append(f"Technical focus areas: {', '.join(common_terms)}")
        
        # Look for measurement patterns
        measurement_count = sum(1 for content in all_content if re.search(r'\d+\.?\d*\s*(?:mm|in|°)', content))
        if measurement_count > 0:
            insights.append(f"Dimensional information detected in {measurement_count} analyses")
        
        return insights
    
    def _calculate_average_confidence(self, analyses: Dict[str, Any]) -> float:
        """Calculate average confidence across all analyses"""
        confidences = [result.get('confidence', 0) for result in analyses.values() 
                      if result.get('status') == 'success']
        return sum(confidences) / len(confidences) if confidences else 0.0
    
    def export_structured_data(self, semantic_results: Dict[str, Any], 
                              format_type: str = 'json') -> Dict[str, Any]:
        """Export semantic analysis results in structured format"""
        try:
            # Prepare export data
            export_data = {
                'metadata': {
                    'export_timestamp': datetime.now().isoformat(),
                    'format_type': format_type,
                    'analysis_timestamp': semantic_results.get('timestamp'),
                    'processing_summary': semantic_results.get('performance_metrics', {})
                },
                'technical_data': {},
                'insights': semantic_results.get('consolidated_insights', {}),
                'ai_analyses': {}
            }
            
            # Extract technical data from AI analyses
            for ai_name, analysis in semantic_results.get('ai_analyses', {}).items():
                if analysis.get('status') == 'success':
                    analysis_data = analysis.get('analysis', {})
                    export_data['ai_analyses'][ai_name] = {
                        'model': analysis.get('model'),
                        'confidence': analysis.get('confidence'),
                        'processing_time': analysis.get('processing_time'),
                        'structured_data': analysis_data
                    }
            
            # Generate technical data summary
            export_data['technical_data'] = self._extract_technical_summary(export_data['ai_analyses'])
            
            return {
                'status': 'success',
                'export_data': export_data,
                'format': format_type
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def _extract_technical_summary(self, ai_analyses: Dict[str, Any]) -> Dict[str, Any]:
        """Extract technical summary from AI analyses"""
        technical_summary = {
            'dimensions': [],
            'materials': [],
            'tolerances': [],
            'standards': [],
            'processes': []
        }
        
        for ai_name, analysis in ai_analyses.items():
            structured_data = analysis.get('structured_data', {})
            
            # Look for technical specifications in various formats
            content_str = str(structured_data).lower()
            
            # Extract dimensions
            dimensions = re.findall(r'\d+\.?\d*\s*(?:mm|cm|m|in|ft|°)', content_str)
            technical_summary['dimensions'].extend(dimensions[:5])  # Limit to 5
            
            # Extract materials
            for material in self.engineering_patterns['material_specifications']:
                if material.lower() in content_str:
                    technical_summary['materials'].append(material)
            
            # Extract standards
            for standard in self.engineering_patterns['drawing_standards']:
                if standard.lower() in content_str:
                    technical_summary['standards'].append(standard)
        
        # Remove duplicates
        for key in technical_summary:
            technical_summary[key] = list(set(technical_summary[key]))
        
        return technical_summary
    
    def get_processing_statistics(self) -> Dict[str, Any]:
        """Get processing statistics for the semantic engine"""
        return {
            'statistics': self.processing_stats,
            'ai_clients_available': list(self.ai_clients.keys()),
            'engineering_patterns_loaded': len(self.engineering_patterns),
            'system_status': 'operational'
        }


# Helper function for standalone usage
async def analyze_semantic_content(analysis_data: Dict[str, Any], context: str = "") -> Dict[str, Any]:
    """Helper function to run semantic analysis"""
    engine = SemanticUnderstandingEngine()
    return await engine.comprehensive_semantic_analysis(analysis_data, context)


if __name__ == "__main__":
    # Demo usage
    async def demo():
        print("🔥 SEMANTIC UNDERSTANDING ENGINE DEMO")
        
        # Mock analysis data
        mock_data = {
            'ocr_results': {
                'tesseract': {
                    'status': 'success',
                    'data': {
                        'extracted_text': 'STEEL BRACKET - DIM: 150mm x 75mm - TOL: ±0.1mm - MATERIAL: SS316'
                    }
                }
            },
            'symbol_results': {
                'analysis_results': {
                    'geometric_shapes': {
                        'total_shapes': 5,
                        'rectangles': [{'area': 1000}],
                        'circles': [{'radius': 10}]
                    }
                }
            }
        }
        
        engine = SemanticUnderstandingEngine()
        results = await engine.comprehensive_semantic_analysis(mock_data, "Engineering bracket analysis")
        
        # Print summary
        print("\n📊 SEMANTIC ANALYSIS SUMMARY:")
        print("=" * 40)
        perf = results['performance_metrics']
        print(f"⚡ Processing Time: {perf['total_processing_time']:.2f}s")
        print(f"🧠 AI Success Rate: {perf['success_rate']:.0f}%")
        print(f"🎯 Average Confidence: {perf['average_confidence']:.0%}")
        print(f"💬 Total Tokens: {perf['total_tokens_used']}")
    
    # Run demo
    asyncio.run(demo())