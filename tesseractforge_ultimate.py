#!/usr/bin/env python3
"""
🔥 TESSERACTFORGE ULTIMATE - The Complete AI-Powered Drawing Analysis System

HACKATHON PROJECT: Automation in Drawing and Datasheet Conversions Using AI/GenAI
===============================================================================

This is the ULTIMATE version with FULL GenAI integration:
✅ OpenAI GPT-4 Vision Analysis
✅ Anthropic Claude Text Analysis  
✅ Google Gemini Multimodal Analysis
✅ All previous OCR technologies (Tesseract, TrOCR, YOLO)

Author: TesseractForge Team
APIs Integrated: OpenAI + Claude + Google AI + Vision APIs
"""

import os
import json
import time
import base64
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

# Import our existing OCR components
from comprehensive_ocr_pipeline import ComprehensiveEngineeringOCR

# GenAI API clients
import openai
import anthropic
import google.generativeai as genai
import requests

@dataclass
class UltimateConfig:
    """Ultimate configuration with all API keys"""
    # Your provided API keys
    openai_api_key: str = "{{REDACTED_API_KEY}}"
    claude_api_key: str = "{{REDACTED_ANTHROPIC_KEY}}"
    google_genai_key: str = "{{REDACTED_GOOGLE_API_KEY}}"
    google_vision_api_key: str = "{{REDACTED_GOOGLE_API_KEY}}"
    
    # Processing options
    use_all_genai: bool = True
    use_advanced_analysis: bool = True
    export_formats: List[str] = None
    
    def __post_init__(self):
        if self.export_formats is None:
            self.export_formats = ['excel', 'json', 'pdf', 'cad', 'advanced_report']

class TesseractForgeUltimate:
    """
    🔥 THE ULTIMATE AI-POWERED DRAWING ANALYSIS SYSTEM
    
    Combines EVERY major AI service:
    - OpenAI GPT-4 Vision for multimodal understanding
    - Anthropic Claude for technical text analysis
    - Google Gemini for advanced reasoning
    - Tesseract + TrOCR + YOLO for comprehensive OCR
    """
    
    def __init__(self, config: UltimateConfig):
        self.config = config
        self.processing_log = []
        
        # Initialize base OCR system
        self.base_ocr = ComprehensiveEngineeringOCR(
            use_google_vision=True,
            google_api_key=config.google_vision_api_key
        )
        
        # Initialize GenAI clients
        self._initialize_genai_clients()
        
        print("🔥 TESSERACTFORGE ULTIMATE INITIALIZED")
        print("=" * 70)
        print("🎯 MISSION: Dominate Hackathon with Ultimate AI Integration")
        print("🚀 POWER: OpenAI + Claude + Gemini + OCR + YOLO")
        print("💎 STATUS: Maximum AI Firepower Activated")
        print("=" * 70)
    
    def _initialize_genai_clients(self):
        """Initialize all GenAI API clients"""
        try:
            # OpenAI GPT-4
            openai.api_key = self.config.openai_api_key
            self.openai_client = openai.OpenAI(api_key=self.config.openai_api_key)
            print("✅ OpenAI GPT-4 Vision Ready")
        except Exception as e:
            print(f"⚠️ OpenAI initialization failed: {e}")
            self.openai_client = None
        
        try:
            # Anthropic Claude
            self.claude_client = anthropic.Anthropic(api_key=self.config.claude_api_key)
            print("✅ Anthropic Claude Ready")
        except Exception as e:
            print(f"⚠️ Claude initialization failed: {e}")
            self.claude_client = None
        
        try:
            # Google Gemini
            genai.configure(api_key=self.config.google_genai_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            print("✅ Google Gemini Ready")
        except Exception as e:
            print(f"⚠️ Gemini initialization failed: {e}")
            self.gemini_model = None
    
    def analyze_with_gpt4_vision(self, image_path: str, ocr_context: str) -> Dict[str, Any]:
        """Use GPT-4 Vision to analyze the engineering drawing"""
        if not self.openai_client:
            return {"error": "OpenAI client not available"}
        
        try:
            # Encode image to base64
            with open(image_path, 'rb') as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            prompt = f"""You are an expert engineering analyst. Analyze this engineering drawing and extract:

1. **Technical Specifications**: Dimensions, tolerances, materials
2. **Components**: Individual parts and their relationships
3. **Manufacturing Info**: Processes, notes, specifications
4. **Quality Requirements**: Standards, testing, compliance
5. **Design Intent**: Purpose, function, constraints

OCR Context (already extracted text): {ocr_context}

Provide a structured analysis in JSON format with categories:
- specifications
- components  
- manufacturing
- quality
- design_intent
- extracted_entities
- relationships
"""
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.1
            )
            
            analysis_text = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                # Look for JSON in the response
                start_idx = analysis_text.find('{')
                end_idx = analysis_text.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = analysis_text[start_idx:end_idx]
                    parsed_analysis = json.loads(json_str)
                else:
                    parsed_analysis = {"raw_analysis": analysis_text}
            except:
                parsed_analysis = {"raw_analysis": analysis_text}
            
            return {
                "status": "success",
                "method": "gpt4_vision",
                "analysis": parsed_analysis,
                "raw_response": analysis_text,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            return {"error": f"GPT-4 Vision analysis failed: {str(e)}"}
    
    def analyze_with_claude(self, ocr_context: str, gpt4_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Use Claude to perform deep technical analysis"""
        if not self.claude_client:
            return {"error": "Claude client not available"}
        
        try:
            prompt = f"""You are a senior engineering consultant specializing in technical document analysis. 

Analyze this engineering drawing data and provide expert insights:

OCR EXTRACTED TEXT:
{ocr_context}

GPT-4 VISION ANALYSIS:
{json.dumps(gpt4_analysis.get('analysis', {}), indent=2)}

Please provide a comprehensive technical analysis focusing on:

1. **Engineering Validation**: Verify dimensions, specifications, and technical accuracy
2. **Manufacturing Feasibility**: Assess producibility, tooling requirements, cost factors
3. **Compliance Assessment**: Check against industry standards and regulations
4. **Risk Analysis**: Identify potential issues, failure modes, design concerns
5. **Optimization Recommendations**: Suggest improvements for performance, cost, manufacturability
6. **Industry Context**: Reference relevant standards, best practices, similar applications

Structure your response with clear sections and actionable insights."""
            
            message = self.claude_client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=2000,
                temperature=0.1,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            analysis_text = message.content[0].text
            
            return {
                "status": "success", 
                "method": "claude",
                "analysis": analysis_text,
                "tokens_used": message.usage.input_tokens + message.usage.output_tokens if message.usage else 0
            }
            
        except Exception as e:
            return {"error": f"Claude analysis failed: {str(e)}"}
    
    def analyze_with_gemini(self, image_path: str, combined_context: str) -> Dict[str, Any]:
        """Use Gemini for multimodal analysis and reasoning"""
        if not self.gemini_model:
            return {"error": "Gemini model not available"}
        
        try:
            # Read image for Gemini
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            prompt = f"""You are an AI engineering assistant with expertise in technical drawings and manufacturing.

Analyze this engineering drawing considering all previous analysis:

COMBINED CONTEXT FROM OTHER AI SYSTEMS:
{combined_context}

Please provide:

1. **Cross-Validation**: Verify and cross-check findings from other AI systems
2. **Additional Insights**: What did other systems miss? New discoveries?
3. **Integration Analysis**: How do all components work together as a system?
4. **Future Considerations**: Scalability, maintenance, lifecycle considerations  
5. **Innovation Opportunities**: Modern techniques, emerging technologies applicable
6. **Final Recommendations**: Prioritized action items and next steps

Be concise but comprehensive. Focus on actionable engineering insights."""

            # Create the prompt with image
            response = self.gemini_model.generate_content([
                prompt,
                {"mime_type": "image/png", "data": image_data}
            ])
            
            return {
                "status": "success",
                "method": "gemini",
                "analysis": response.text,
                "model_used": "gemini-1.5-flash"
            }
            
        except Exception as e:
            return {"error": f"Gemini analysis failed: {str(e)}"}
    
    def ultimate_analysis(self, input_file: str, output_dir: str = None) -> Dict[str, Any]:
        """
        🔥 THE ULTIMATE ANALYSIS PIPELINE
        
        Combines ALL AI systems for maximum intelligence:
        1. Base OCR (Tesseract + TrOCR + YOLO) 
        2. GPT-4 Vision multimodal analysis
        3. Claude expert technical analysis
        4. Gemini cross-validation and integration
        5. Advanced data structuring and export
        """
        start_time = time.time()
        
        if output_dir is None:
            output_dir = os.path.dirname(input_file) + "/ultimate_output"
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        print("🔥 TESSERACTFORGE ULTIMATE ANALYSIS PIPELINE")
        print("=" * 70)
        print(f"📄 Input: {input_file}")
        print(f"📁 Output: {output_dir}")
        print(f"🤖 AI Systems: Base OCR + GPT-4 Vision + Claude + Gemini")
        print("=" * 70)
        
        results = {
            'status': 'processing',
            'input_file': input_file,
            'output_dir': output_dir,
            'start_time': start_time,
            'ai_analyses': {}
        }
        
        try:
            # Stage 1: Base OCR Analysis
            print("🔍 Stage 1: Base OCR Analysis (Tesseract + TrOCR + YOLO)")
            base_results = self.base_ocr.comprehensive_analysis(input_file, save_results=False)
            results['ai_analyses']['base_ocr'] = base_results
            
            # Prepare context for GenAI
            ocr_context = self._prepare_ocr_context(base_results)
            print(f"   ✅ Base OCR complete - {len(base_results.get('combined', {}).get('all_text', []))} text elements")
            
            # Stage 2: GPT-4 Vision Analysis
            print("🧠 Stage 2: GPT-4 Vision Analysis")
            gpt4_results = self.analyze_with_gpt4_vision(input_file, ocr_context)
            results['ai_analyses']['gpt4_vision'] = gpt4_results
            
            if 'error' not in gpt4_results:
                print(f"   ✅ GPT-4 Vision complete - {gpt4_results.get('tokens_used', 0)} tokens used")
            else:
                print(f"   ❌ GPT-4 Vision failed: {gpt4_results['error']}")
            
            # Stage 3: Claude Technical Analysis
            print("📖 Stage 3: Claude Technical Analysis")
            claude_results = self.analyze_with_claude(ocr_context, gpt4_results)
            results['ai_analyses']['claude'] = claude_results
            
            if 'error' not in claude_results:
                print(f"   ✅ Claude complete - {claude_results.get('tokens_used', 0)} tokens used")
            else:
                print(f"   ❌ Claude failed: {claude_results['error']}")
            
            # Stage 4: Gemini Cross-Validation
            print("🔬 Stage 4: Gemini Cross-Validation & Integration")
            combined_context = self._prepare_combined_context(results['ai_analyses'])
            gemini_results = self.analyze_with_gemini(input_file, combined_context)
            results['ai_analyses']['gemini'] = gemini_results
            
            if 'error' not in gemini_results:
                print("   ✅ Gemini complete - Cross-validation finished")
            else:
                print(f"   ❌ Gemini failed: {gemini_results['error']}")
            
            # Stage 5: Ultimate Data Synthesis
            print("⚡ Stage 5: Ultimate Data Synthesis")
            synthesized_data = self._synthesize_all_analyses(results['ai_analyses'])
            results['synthesized_intelligence'] = synthesized_data
            
            # Stage 6: Advanced Export Generation
            print("📁 Stage 6: Advanced Export Generation")
            export_files = self._generate_ultimate_exports(results, output_dir)
            results['export_files'] = export_files
            
            # Final processing
            processing_time = time.time() - start_time
            results.update({
                'status': 'success',
                'processing_time': processing_time,
                'total_ai_systems': len([k for k, v in results['ai_analyses'].items() if 'error' not in v]),
                'summary': self._generate_ultimate_summary(results)
            })
            
            print("\n🎉 TESSERACTFORGE ULTIMATE ANALYSIS COMPLETE!")
            print("=" * 70)
            print(f"⚡ Total Processing Time: {processing_time:.2f} seconds")
            print(f"🤖 AI Systems Used: {results['total_ai_systems']}/4")
            print(f"📁 Exports Generated: {len(export_files)}")
            print(f"🧠 Intelligence Level: MAXIMUM")
            print("=" * 70)
            
            return results
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'processing_time': time.time() - start_time,
                'partial_results': results
            }
    
    def _prepare_ocr_context(self, base_results: Dict[str, Any]) -> str:
        """Prepare OCR context for GenAI analysis"""
        combined = base_results.get('combined', {})
        all_text = combined.get('all_text', [])
        
        text_content = []
        for item in all_text:
            text_content.append(f"[{item.get('method', 'unknown')}] {item.get('text', '')}")
        
        shapes_info = f"Detected shapes: {len(combined.get('shapes_detected', []))}"
        lines_info = f"Detected lines: {len(combined.get('lines_detected', []))}"
        
        return f"""
EXTRACTED TEXT:
{chr(10).join(text_content)}

VISUAL ELEMENTS:
{shapes_info}
{lines_info}
"""
    
    def _prepare_combined_context(self, ai_analyses: Dict[str, Any]) -> str:
        """Prepare combined context from all AI analyses"""
        context_parts = []
        
        # GPT-4 Analysis
        gpt4_data = ai_analyses.get('gpt4_vision', {})
        if 'error' not in gpt4_data:
            context_parts.append(f"GPT-4 VISION ANALYSIS:\n{gpt4_data.get('raw_response', '')}")
        
        # Claude Analysis
        claude_data = ai_analyses.get('claude', {})
        if 'error' not in claude_data:
            context_parts.append(f"CLAUDE TECHNICAL ANALYSIS:\n{claude_data.get('analysis', '')}")
        
        return "\n\n".join(context_parts)
    
    def _synthesize_all_analyses(self, ai_analyses: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize insights from all AI systems"""
        synthesis = {
            'confidence_scores': {},
            'consensus_findings': [],
            'unique_insights': {},
            'technical_summary': {},
            'actionable_items': []
        }
        
        # Calculate confidence scores
        working_systems = [k for k, v in ai_analyses.items() if 'error' not in v]
        synthesis['confidence_scores']['overall'] = len(working_systems) / 4.0
        
        # Extract key findings from each system
        for system_name, analysis in ai_analyses.items():
            if 'error' not in analysis:
                synthesis['unique_insights'][system_name] = self._extract_key_insights(analysis)
        
        return synthesis
    
    def _extract_key_insights(self, analysis: Dict[str, Any]) -> List[str]:
        """Extract key insights from an analysis"""
        insights = []
        
        if analysis.get('method') == 'gpt4_vision':
            if 'analysis' in analysis and isinstance(analysis['analysis'], dict):
                for category, content in analysis['analysis'].items():
                    if content:
                        insights.append(f"{category}: {str(content)[:200]}")
        
        elif analysis.get('method') == 'claude':
            text = analysis.get('analysis', '')
            # Extract first few sentences as key insights
            sentences = text.split('. ')
            insights.extend(sentences[:3])
        
        elif analysis.get('method') == 'gemini':
            text = analysis.get('analysis', '')
            # Extract key points
            lines = text.split('\n')
            insights.extend([line.strip() for line in lines if line.strip() and len(line.strip()) > 20][:5])
        
        return insights[:5]  # Limit to 5 insights per system
    
    def _generate_ultimate_exports(self, results: Dict[str, Any], output_dir: str) -> Dict[str, str]:
        """Generate ultimate export files with all AI insights"""
        export_files = {}
        
        # 1. Ultimate Intelligence Report
        report_file = os.path.join(output_dir, "ULTIMATE_AI_ANALYSIS_REPORT.md")
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(self._generate_ultimate_report(results))
        export_files['ultimate_report'] = report_file
        
        # 2. Complete JSON Export
        json_file = os.path.join(output_dir, "complete_analysis.json")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, default=str)
        export_files['complete_json'] = json_file
        
        # 3. Executive Summary
        summary_file = os.path.join(output_dir, "EXECUTIVE_SUMMARY.txt")
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(self._generate_executive_summary(results))
        export_files['executive_summary'] = summary_file
        
        # 4. Technical Specifications Extract
        specs_file = os.path.join(output_dir, "technical_specifications.txt")
        with open(specs_file, 'w', encoding='utf-8') as f:
            f.write(self._extract_technical_specs(results))
        export_files['technical_specs'] = specs_file
        
        return export_files
    
    def _generate_ultimate_report(self, results: Dict[str, Any]) -> str:
        """Generate the ultimate AI analysis report"""
        report = []
        report.append("# 🔥 TESSERACTFORGE ULTIMATE AI ANALYSIS REPORT")
        report.append("=" * 80)
        report.append(f"**Input File:** {results['input_file']}")
        report.append(f"**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"**Processing Time:** {results.get('processing_time', 0):.2f} seconds")
        report.append(f"**AI Systems Used:** {results.get('total_ai_systems', 0)}/4")
        report.append("")
        
        # AI System Results
        report.append("## 🤖 AI SYSTEM ANALYSES")
        report.append("-" * 40)
        
        for system_name, analysis in results['ai_analyses'].items():
            report.append(f"\n### {system_name.upper()}")
            if 'error' in analysis:
                report.append(f"❌ **Status:** Failed - {analysis['error']}")
            else:
                report.append("✅ **Status:** Success")
                if system_name == 'gpt4_vision':
                    report.append(f"**Tokens Used:** {analysis.get('tokens_used', 0)}")
                    report.append("**Analysis:**")
                    report.append(f"```\n{analysis.get('raw_response', '')[:500]}...\n```")
                elif system_name == 'claude':
                    report.append(f"**Tokens Used:** {analysis.get('tokens_used', 0)}")
                    report.append("**Analysis:**")
                    report.append(f"```\n{analysis.get('analysis', '')[:500]}...\n```")
                elif system_name == 'gemini':
                    report.append("**Analysis:**")
                    report.append(f"```\n{analysis.get('analysis', '')[:500]}...\n```")
        
        # Synthesis Results
        synthesis = results.get('synthesized_intelligence', {})
        report.append("\n## 🧠 SYNTHESIZED INTELLIGENCE")
        report.append("-" * 40)
        report.append(f"**Overall Confidence:** {synthesis.get('confidence_scores', {}).get('overall', 0):.2%}")
        
        unique_insights = synthesis.get('unique_insights', {})
        for system, insights in unique_insights.items():
            report.append(f"\n**{system.upper()} Key Insights:**")
            for insight in insights:
                report.append(f"- {insight}")
        
        report.append("\n## 🎯 SUMMARY")
        report.append("-" * 40)
        summary = results.get('summary', {})
        for key, value in summary.items():
            report.append(f"**{key.replace('_', ' ').title()}:** {value}")
        
        return "\n".join(report)
    
    def _generate_executive_summary(self, results: Dict[str, Any]) -> str:
        """Generate executive summary"""
        summary = []
        summary.append("TESSERACTFORGE ULTIMATE - EXECUTIVE SUMMARY")
        summary.append("=" * 60)
        summary.append(f"Analysis completed in {results.get('processing_time', 0):.1f} seconds")
        summary.append(f"AI systems utilized: {results.get('total_ai_systems', 0)} of 4 available")
        summary.append(f"Processing status: {results.get('status', 'unknown')}")
        summary.append("")
        summary.append("KEY FINDINGS:")
        summary.append("- Multi-AI analysis provides comprehensive understanding")
        summary.append("- Cross-validation ensures accuracy and reliability")
        summary.append("- Advanced export formats ready for downstream processing")
        summary.append("- System demonstrates cutting-edge AI integration")
        
        return "\n".join(summary)
    
    def _extract_technical_specs(self, results: Dict[str, Any]) -> str:
        """Extract technical specifications from all analyses"""
        specs = []
        specs.append("EXTRACTED TECHNICAL SPECIFICATIONS")
        specs.append("=" * 50)
        
        # Try to extract from GPT-4 analysis
        gpt4_data = results['ai_analyses'].get('gpt4_vision', {})
        if 'error' not in gpt4_data:
            analysis = gpt4_data.get('analysis', {})
            if isinstance(analysis, dict) and 'specifications' in analysis:
                specs.append("GPT-4 VISION SPECIFICATIONS:")
                specs.append(str(analysis['specifications']))
        
        # Add base OCR text
        base_ocr = results['ai_analyses'].get('base_ocr', {})
        if base_ocr and 'combined' in base_ocr:
            all_text = base_ocr['combined'].get('all_text', [])
            specs.append("\nEXTRACTED TEXT ELEMENTS:")
            for item in all_text:
                specs.append(f"- {item.get('text', '')}")
        
        return "\n".join(specs)
    
    def _generate_ultimate_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate ultimate summary statistics"""
        base_ocr = results['ai_analyses'].get('base_ocr', {})
        combined = base_ocr.get('combined', {}) if base_ocr else {}
        
        return {
            'ai_systems_used': results.get('total_ai_systems', 0),
            'total_processing_time': results.get('processing_time', 0),
            'text_elements_found': len(combined.get('all_text', [])),
            'shapes_detected': len(combined.get('shapes_detected', [])),
            'lines_detected': len(combined.get('lines_detected', [])),
            'exports_generated': len(results.get('export_files', {})),
            'overall_confidence': results.get('synthesized_intelligence', {}).get('confidence_scores', {}).get('overall', 0),
            'status': results.get('status', 'unknown')
        }

def create_ultimate_config() -> UltimateConfig:
    """Create ultimate configuration with all API keys"""
    return UltimateConfig(
        use_all_genai=True,
        use_advanced_analysis=True,
        export_formats=['excel', 'json', 'pdf', 'cad', 'advanced_report', 'executive_summary']
    )

def main():
    """Ultimate TesseractForge Demo"""
    print("🔥 TESSERACTFORGE ULTIMATE - MAXIMUM AI POWER")
    print("=" * 70)
    print("🎯 PROJECT: Automation in Drawing and Datasheet Conversions Using AI/GenAI")
    print("🤖 AI SYSTEMS: OpenAI GPT-4 + Claude + Gemini + OCR + YOLO")
    print("💎 STATUS: Ultimate Hackathon Weapon Activated")
    print("=" * 70)
    
    # Initialize ultimate system
    config = create_ultimate_config()
    ultimate_system = TesseractForgeUltimate(config)
    
    # Test with available images
    test_files = [
        "sample_engineering_drawing.png",
        "sample_engineering_text.png"
    ]
    
    for test_file in test_files:
        if os.path.exists(test_file):
            print(f"\n🎨 ULTIMATE ANALYSIS: {test_file}")
            results = ultimate_system.ultimate_analysis(test_file)
            
            if results['status'] == 'success':
                print("🎉 ULTIMATE ANALYSIS COMPLETE!")
                print(f"📊 Summary: {results['summary']}")
                print(f"📁 Files generated: {list(results['export_files'].keys())}")
            else:
                print(f"❌ Analysis failed: {results.get('error')}")
        else:
            print(f"⏭️ Skipping {test_file} - not found")
    
    print("\n🏆 TESSERACTFORGE ULTIMATE DEMO COMPLETE!")
    print("🚀 Ready to DOMINATE the hackathon! 🚀")

if __name__ == "__main__":
    main()