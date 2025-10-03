'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, FolderOpen, Clock, CheckCircle, 
  AlertTriangle, Play, Download, Trash2 
} from 'lucide-react';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onView?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export default function ProjectCard({ project, onView, onDelete }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'active': return Play;
      case 'archived': return FolderOpen;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(project.status);
  const completedConversions = project.conversions?.filter(c => c.status === 'completed').length || 0;
  const processingConversions = project.conversions?.filter(c => c.status === 'processing').length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate mb-2">{project.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {project.description || 'No description provided'}
              </CardDescription>
            </div>
            <div className="ml-4 flex items-center space-x-2">
              <Badge className={getStatusColor(project.status)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {project.status}
              </Badge>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{project.drawingCount}</div>
              <div className="text-xs text-gray-500">Total Drawings</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedConversions}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>

          {/* Progress */}
          {processingConversions > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing</span>
                <span className="text-blue-600 font-medium">{processingConversions} drawings</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedConversions / project.drawingCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onView?.(project)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              View
            </Button>
            {completedConversions > 0 && (
              <Button size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div className="flex justify-between">
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}