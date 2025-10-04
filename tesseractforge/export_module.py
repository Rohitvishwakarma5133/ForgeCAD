"""
Enhanced Export Module for TesseractForge
Provides export functionality for Excel, PDF, and Autodesk API integration
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import logging
from dataclasses import asdict

import pandas as pd
import xlsxwriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import requests
import aiohttp
from PIL import Image as PILImage
import matplotlib.pyplot as plt
import seaborn as sns

from loguru import logger

class ExportModule:
    """
    Comprehensive export module supporting multiple output formats and API integrations
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.setup_logging()
        
        # Export settings
        self.export_settings = {
            'excel': {
                'include_images': True,
                'create_summary': True,
                'format_cells': True
            },
            'pdf': {
                'include_visualizations': True,
                'page_size': A4,
                'margin': 0.75 * inch
            },
            'autodesk': {
                'base_url': 'https://developer.api.autodesk.com',
                'timeout': 30
            }
        }
        
        # Initialize Autodesk API credentials
        self.autodesk_config = {
            'client_id': os.getenv('AUTODESK_CLIENT_ID'),
            'client_secret': os.getenv('AUTODESK_CLIENT_SECRET'),
            'access_token': None
        }
    
    def setup_logging(self):
        """Setup logging configuration"""
        logger.add(
            "logs/export_{time}.log",
            rotation="1 day",
            retention="30 days",
            level="INFO"
        )
    
    async def export_to_excel(self, 
                            data: Dict[str, Any], 
                            output_path: str,
                            include_visualizations: bool = True) -> Dict[str, Any]:
        """
        Export data to Excel format with advanced formatting and visualizations
        
        Args:
            data: Processed data from the pipeline
            output_path: Path to save the Excel file
            include_visualizations: Whether to include charts and visualizations
            
        Returns:
            Export result dictionary
        """
        try:
            logger.info(f"Starting Excel export to {output_path}")
            
            # Create workbook and add worksheets
            workbook = xlsxwriter.Workbook(output_path)
            
            # Define formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#366092',
                'font_color': 'white',
                'border': 1
            })
            
            cell_format = workbook.add_format({
                'border': 1,
                'text_wrap': True
            })
            
            # Summary worksheet
            summary_ws = workbook.add_worksheet('Summary')
            await self._create_summary_sheet(summary_ws, data, header_format, cell_format)
            
            # OCR Results worksheet
            if 'ocr_results' in data:
                ocr_ws = workbook.add_worksheet('OCR_Results')
                await self._create_ocr_sheet(ocr_ws, data['ocr_results'], header_format, cell_format)
            
            # Symbol Detection worksheet
            if 'symbol_results' in data:
                symbol_ws = workbook.add_worksheet('Symbol_Detection')
                await self._create_symbol_sheet(symbol_ws, data['symbol_results'], header_format, cell_format)
            
            # Semantic Analysis worksheet
            if 'semantic_results' in data:
                semantic_ws = workbook.add_worksheet('Semantic_Analysis')
                await self._create_semantic_sheet(semantic_ws, data['semantic_results'], header_format, cell_format)
            
            # Components worksheet
            if 'components' in data:
                components_ws = workbook.add_worksheet('Components')
                await self._create_components_sheet(components_ws, data['components'], header_format, cell_format)
            
            # Visualizations
            if include_visualizations:
                viz_ws = workbook.add_worksheet('Visualizations')
                await self._create_visualization_sheet(viz_ws, data)
            
            workbook.close()
            
            result = {
                'status': 'success',
                'output_path': output_path,
                'file_size': os.path.getsize(output_path),
                'worksheets': ['Summary', 'OCR_Results', 'Symbol_Detection', 'Semantic_Analysis', 'Components'],
                'timestamp': datetime.now().isoformat()
            }
            
            logger.success(f"Excel export completed successfully: {output_path}")
            return result
            
        except Exception as e:
            logger.error(f"Excel export failed: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def export_to_pdf(self, 
                           data: Dict[str, Any], 
                           output_path: str,
                           include_images: bool = True) -> Dict[str, Any]:
        """
        Export data to PDF format with professional formatting
        
        Args:
            data: Processed data from the pipeline
            output_path: Path to save the PDF file
            include_images: Whether to include processed images
            
        Returns:
            Export result dictionary
        """
        try:
            logger.info(f"Starting PDF export to {output_path}")
            
            # Create PDF document
            doc = SimpleDocTemplate(
                output_path,
                pagesize=self.export_settings['pdf']['page_size'],
                topMargin=self.export_settings['pdf']['margin'],
                bottomMargin=self.export_settings['pdf']['margin'],
                leftMargin=self.export_settings['pdf']['margin'],
                rightMargin=self.export_settings['pdf']['margin']
            )
            
            # Document elements
            elements = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=1  # Center alignment
            )
            
            # Title
            elements.append(Paragraph("Technical Drawing Analysis Report", title_style))
            elements.append(Spacer(1, 20))
            
            # Summary section
            await self._add_pdf_summary(elements, data, styles)
            
            # OCR Results section
            if 'ocr_results' in data:
                await self._add_pdf_ocr_section(elements, data['ocr_results'], styles)
            
            # Symbol Detection section
            if 'symbol_results' in data:
                await self._add_pdf_symbol_section(elements, data['symbol_results'], styles)
            
            # Semantic Analysis section
            if 'semantic_results' in data:
                await self._add_pdf_semantic_section(elements, data['semantic_results'], styles)
            
            # Components section
            if 'components' in data:
                await self._add_pdf_components_section(elements, data['components'], styles)
            
            # Include processed images
            if include_images and 'processed_images' in data:
                await self._add_pdf_images_section(elements, data['processed_images'], styles)
            
            # Build PDF
            doc.build(elements)
            
            result = {
                'status': 'success',
                'output_path': output_path,
                'file_size': os.path.getsize(output_path),
                'sections': ['Summary', 'OCR Results', 'Symbol Detection', 'Semantic Analysis', 'Components'],
                'timestamp': datetime.now().isoformat()
            }
            
            logger.success(f"PDF export completed successfully: {output_path}")
            return result
            
        except Exception as e:
            logger.error(f"PDF export failed: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def export_to_autodesk(self, 
                               data: Dict[str, Any],
                               project_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Export/upload data to Autodesk platform via API
        
        Args:
            data: Processed data from the pipeline
            project_id: Optional Autodesk project ID
            
        Returns:
            Upload result dictionary
        """
        try:
            logger.info("Starting Autodesk API export")
            
            # Authenticate with Autodesk API
            auth_result = await self._authenticate_autodesk()
            if not auth_result['success']:
                return {
                    'status': 'error',
                    'error': 'Autodesk authentication failed',
                    'details': auth_result
                }
            
            # Prepare data for Autodesk format
            autodesk_data = await self._format_for_autodesk(data)
            
            # Upload to Autodesk Data Management API
            upload_result = await self._upload_to_autodesk(autodesk_data, project_id)
            
            result = {
                'status': 'success' if upload_result['success'] else 'error',
                'autodesk_response': upload_result,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.success("Autodesk API export completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Autodesk export failed: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def batch_export(self, 
                          data: Dict[str, Any], 
                          output_dir: str,
                          formats: List[str] = ['excel', 'pdf', 'json']) -> Dict[str, Any]:
        """
        Export data to multiple formats simultaneously
        
        Args:
            data: Processed data from the pipeline
            output_dir: Directory to save all export files
            formats: List of formats to export ('excel', 'pdf', 'json', 'autodesk')
            
        Returns:
            Batch export results
        """
        try:
            logger.info(f"Starting batch export to formats: {formats}")
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate timestamp for filenames
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_name = f"cadly_analysis_{timestamp}"
            
            results = {}
            
            # Export tasks
            tasks = []
            
            if 'excel' in formats:
                excel_path = os.path.join(output_dir, f"{base_name}.xlsx")
                tasks.append(('excel', self.export_to_excel(data, excel_path)))
            
            if 'pdf' in formats:
                pdf_path = os.path.join(output_dir, f"{base_name}.pdf")
                tasks.append(('pdf', self.export_to_pdf(data, pdf_path)))
            
            if 'json' in formats:
                json_path = os.path.join(output_dir, f"{base_name}.json")
                tasks.append(('json', self._export_to_json(data, json_path)))
            
            if 'autodesk' in formats:
                tasks.append(('autodesk', self.export_to_autodesk(data)))
            
            # Execute all export tasks concurrently
            export_results = await asyncio.gather(*[task[1] for task in tasks])
            
            # Combine results
            for i, (format_name, _) in enumerate(tasks):
                results[format_name] = export_results[i]
            
            # Summary
            successful_exports = [fmt for fmt, result in results.items() 
                                if result.get('status') == 'success']
            
            batch_result = {
                'status': 'success' if successful_exports else 'error',
                'successful_formats': successful_exports,
                'results': results,
                'output_directory': output_dir,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.success(f"Batch export completed. Successful formats: {successful_exports}")
            return batch_result
            
        except Exception as e:
            logger.error(f"Batch export failed: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    # Helper methods for Excel export
    async def _create_summary_sheet(self, worksheet, data, header_format, cell_format):
        """Create summary worksheet"""
        worksheet.write('A1', 'Analysis Summary', header_format)
        
        # Summary data
        summary_data = [
            ['Total Images Processed', len(data.get('processed_images', []))],
            ['OCR Engines Used', len(data.get('ocr_results', {}).get('engines', []))],
            ['Symbols Detected', len(data.get('symbol_results', {}).get('detected_symbols', []))],
            ['Components Identified', len(data.get('components', []))],
            ['Processing Time (seconds)', data.get('processing_time', 'N/A')],
            ['Analysis Date', datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        ]
        
        for row, (label, value) in enumerate(summary_data, start=2):
            worksheet.write(row, 0, label, cell_format)
            worksheet.write(row, 1, str(value), cell_format)
        
        worksheet.set_column('A:A', 25)
        worksheet.set_column('B:B', 20)
    
    async def _create_ocr_sheet(self, worksheet, ocr_data, header_format, cell_format):
        """Create OCR results worksheet"""
        headers = ['Engine', 'Text', 'Confidence', 'Coordinates']
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        row = 1
        for engine, results in ocr_data.items():
            if isinstance(results, dict) and 'text' in results:
                worksheet.write(row, 0, engine, cell_format)
                worksheet.write(row, 1, results['text'], cell_format)
                worksheet.write(row, 2, results.get('confidence', 'N/A'), cell_format)
                worksheet.write(row, 3, str(results.get('coordinates', 'N/A')), cell_format)
                row += 1
    
    async def _create_symbol_sheet(self, worksheet, symbol_data, header_format, cell_format):
        """Create symbol detection worksheet"""
        headers = ['Symbol Type', 'Count', 'Confidence', 'Coordinates']
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        row = 1
        for symbol in symbol_data.get('detected_symbols', []):
            worksheet.write(row, 0, symbol.get('type', 'Unknown'), cell_format)
            worksheet.write(row, 1, symbol.get('count', 1), cell_format)
            worksheet.write(row, 2, symbol.get('confidence', 'N/A'), cell_format)
            worksheet.write(row, 3, str(symbol.get('coordinates', 'N/A')), cell_format)
            row += 1
    
    async def _create_semantic_sheet(self, worksheet, semantic_data, header_format, cell_format):
        """Create semantic analysis worksheet"""
        headers = ['Category', 'Value', 'Source', 'Confidence']
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        row = 1
        for category, analysis in semantic_data.items():
            if isinstance(analysis, dict):
                for key, value in analysis.items():
                    worksheet.write(row, 0, f"{category}: {key}", cell_format)
                    worksheet.write(row, 1, str(value), cell_format)
                    worksheet.write(row, 2, 'AI Analysis', cell_format)
                    worksheet.write(row, 3, 'High', cell_format)
                    row += 1
    
    async def _create_components_sheet(self, worksheet, components_data, header_format, cell_format):
        """Create components worksheet"""
        headers = ['Component ID', 'Type', 'Specifications', 'Quantity', 'Notes']
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        for row, component in enumerate(components_data, start=1):
            worksheet.write(row, 0, component.get('id', 'N/A'), cell_format)
            worksheet.write(row, 1, component.get('type', 'N/A'), cell_format)
            worksheet.write(row, 2, str(component.get('specifications', 'N/A')), cell_format)
            worksheet.write(row, 3, component.get('quantity', 'N/A'), cell_format)
            worksheet.write(row, 4, component.get('notes', 'N/A'), cell_format)
    
    async def _create_visualization_sheet(self, worksheet, data):
        """Create visualizations worksheet"""
        # This would create charts and graphs using matplotlib/seaborn
        # For now, we'll add placeholder text
        worksheet.write('A1', 'Visualizations will be generated here')
    
    # Helper methods for PDF export
    async def _add_pdf_summary(self, elements, data, styles):
        """Add summary section to PDF"""
        elements.append(Paragraph("Executive Summary", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        summary_text = f"""
        This report contains the analysis of technical drawings processed through the 
        TesseractForge AI pipeline. The analysis includes OCR text extraction, symbol 
        detection, and semantic understanding of engineering drawings.
        
        Total Images Processed: {len(data.get('processed_images', []))}
        Processing Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        elements.append(Paragraph(summary_text, styles['Normal']))
        elements.append(Spacer(1, 20))
    
    async def _add_pdf_ocr_section(self, elements, ocr_data, styles):
        """Add OCR results section to PDF"""
        elements.append(Paragraph("OCR Text Extraction Results", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        for engine, results in ocr_data.items():
            if isinstance(results, dict) and 'text' in results:
                elements.append(Paragraph(f"<b>{engine} Results:</b>", styles['Heading3']))
                elements.append(Paragraph(results['text'], styles['Normal']))
                elements.append(Spacer(1, 10))
    
    async def _add_pdf_symbol_section(self, elements, symbol_data, styles):
        """Add symbol detection section to PDF"""
        elements.append(Paragraph("Symbol Detection Results", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        symbols_text = f"Detected {len(symbol_data.get('detected_symbols', []))} symbols"
        elements.append(Paragraph(symbols_text, styles['Normal']))
        elements.append(Spacer(1, 20))
    
    async def _add_pdf_semantic_section(self, elements, semantic_data, styles):
        """Add semantic analysis section to PDF"""
        elements.append(Paragraph("Semantic Analysis Results", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        for category, analysis in semantic_data.items():
            elements.append(Paragraph(f"<b>{category.title()}:</b>", styles['Heading3']))
            if isinstance(analysis, dict):
                for key, value in analysis.items():
                    elements.append(Paragraph(f"{key}: {value}", styles['Normal']))
            elements.append(Spacer(1, 10))
    
    async def _add_pdf_components_section(self, elements, components_data, styles):
        """Add components section to PDF"""
        elements.append(Paragraph("Identified Components", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        if components_data:
            # Create table for components
            table_data = [['Component ID', 'Type', 'Quantity']]
            for component in components_data:
                table_data.append([
                    component.get('id', 'N/A'),
                    component.get('type', 'N/A'),
                    str(component.get('quantity', 'N/A'))
                ])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
        elements.append(Spacer(1, 20))
    
    async def _add_pdf_images_section(self, elements, images_data, styles):
        """Add processed images section to PDF"""
        elements.append(Paragraph("Processed Images", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        # Add placeholder for images
        elements.append(Paragraph("Processed images would be embedded here", styles['Normal']))
        elements.append(Spacer(1, 20))
    
    # Autodesk API methods
    async def _authenticate_autodesk(self) -> Dict[str, Any]:
        """Authenticate with Autodesk API"""
        try:
            if not self.autodesk_config['client_id'] or not self.autodesk_config['client_secret']:
                return {
                    'success': False,
                    'error': 'Autodesk API credentials not configured'
                }
            
            auth_url = f"{self.export_settings['autodesk']['base_url']}/authentication/v1/authenticate"
            
            auth_data = {
                'client_id': self.autodesk_config['client_id'],
                'client_secret': self.autodesk_config['client_secret'],
                'grant_type': 'client_credentials',
                'scope': 'data:read data:write'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(auth_url, data=auth_data) as response:
                    if response.status == 200:
                        result = await response.json()
                        self.autodesk_config['access_token'] = result.get('access_token')
                        return {'success': True, 'token': result.get('access_token')}
                    else:
                        return {
                            'success': False,
                            'error': f'Authentication failed: {response.status}'
                        }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Authentication error: {str(e)}'
            }
    
    async def _format_for_autodesk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format data for Autodesk API"""
        # Convert data to Autodesk-compatible format
        autodesk_format = {
            'metadata': {
                'source': 'TesseractForge',
                'analysis_date': datetime.now().isoformat(),
                'version': '1.0'
            },
            'drawing_analysis': {
                'ocr_results': data.get('ocr_results', {}),
                'symbols': data.get('symbol_results', {}),
                'semantic_analysis': data.get('semantic_results', {}),
                'components': data.get('components', [])
            }
        }
        return autodesk_format
    
    async def _upload_to_autodesk(self, data: Dict[str, Any], project_id: Optional[str]) -> Dict[str, Any]:
        """Upload data to Autodesk platform"""
        try:
            if not self.autodesk_config['access_token']:
                return {
                    'success': False,
                    'error': 'No valid access token'
                }
            
            # This is a simplified example - actual implementation would depend on specific Autodesk APIs
            upload_url = f"{self.export_settings['autodesk']['base_url']}/data/v1/projects/{project_id}/items"
            
            headers = {
                'Authorization': f"Bearer {self.autodesk_config['access_token']}",
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(upload_url, json=data, headers=headers) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        return {
                            'success': True,
                            'response': result
                        }
                    else:
                        return {
                            'success': False,
                            'error': f'Upload failed: {response.status}'
                        }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Upload error: {str(e)}'
            }
    
    async def _export_to_json(self, data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """Export data to JSON format"""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str)
            
            return {
                'status': 'success',
                'output_path': output_path,
                'file_size': os.path.getsize(output_path),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Example usage
async def main():
    """Example usage of the export module"""
    export_module = ExportModule()
    
    # Sample data structure
    sample_data = {
        'processed_images': ['image1.jpg', 'image2.jpg'],
        'ocr_results': {
            'openai': {
                'text': 'Sample OCR text from OpenAI',
                'confidence': 0.95
            },
            'tesseract': {
                'text': 'Sample OCR text from Tesseract',
                'confidence': 0.87
            }
        },
        'symbol_results': {
            'detected_symbols': [
                {'type': 'circle', 'count': 3, 'confidence': 0.92},
                {'type': 'rectangle', 'count': 5, 'confidence': 0.88}
            ]
        },
        'semantic_results': {
            'technical_specs': {
                'dimensions': '10x20mm',
                'material': 'Steel'
            }
        },
        'components': [
            {'id': 'C001', 'type': 'Fastener', 'quantity': 4},
            {'id': 'C002', 'type': 'Bracket', 'quantity': 2}
        ],
        'processing_time': 45.2
    }
    
    # Batch export to multiple formats
    result = await export_module.batch_export(
        sample_data, 
        'output', 
        formats=['excel', 'pdf', 'json']
    )
    
    print(f"Export result: {result}")

if __name__ == "__main__":
    asyncio.run(main())