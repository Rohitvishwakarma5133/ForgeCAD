'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { Plus, Search, Filter, Grid, List, FolderPlus, RefreshCw, AlertTriangle } from 'lucide-react';
import { Project } from '@/types';

export default function ProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: selectedTab === 'all' ? '' : selectedTab,
        search: searchQuery,
        limit: '50'
      });

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load projects');
      }
      
      setProjects(data.projects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedTab, searchQuery]);

  const filteredProjects = projects;

  const handleProjectView = (project: Project) => {
    // Navigate to project detail page without full reload
    router.push(`/dashboard/projects/${project.id}`);
  };

  const handleProjectDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh projects list
        fetchProjects();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (error) {
      alert('Failed to delete project');
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Projects</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchProjects}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">
            Organize and manage your drawing conversion projects
          </p>
        </div>
        <div className="flex gap-3">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none border-l"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <FolderPlus className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery 
              ? `No projects match your search for "${searchQuery}"`
              : 'Create your first project to start organizing your drawing conversions.'
            }
          </p>
          {!searchQuery && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { 
                label: 'Total Projects', 
                value: projects.length, 
                color: 'blue' 
              },
              { 
                label: 'Active Projects', 
                value: projects.filter(p => p.status === 'active').length, 
                color: 'green' 
              },
              { 
                label: 'Total Drawings', 
                value: projects.reduce((sum, p) => sum + p.drawingCount, 0), 
                color: 'purple' 
              },
              { 
                label: 'Completed Projects', 
                value: projects.filter(p => p.status === 'completed').length, 
                color: 'orange' 
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Projects Display */}
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {viewMode === 'grid' ? (
                  <ProjectCard
                    project={project}
                    onView={handleProjectView}
                    onDelete={handleProjectDelete}
                  />
                ) : (
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {project.name}
                            </h3>
                            <Badge className={
                              project.status === 'completed' ? 'bg-green-100 text-green-700' :
                              project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span>{project.drawingCount} drawings</span>
                            <span>Created {project.createdAt.toLocaleDateString()}</span>
                            <span>Updated {project.updatedAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProjectView(project)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}