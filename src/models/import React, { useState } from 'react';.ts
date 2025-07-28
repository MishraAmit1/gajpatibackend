import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, GitCompare, Filter, Building2, Beaker, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import roadbondHero from '@/assets/roadbond-hero.jpg';
import rockgridHero from '@/assets/rockgrid-hero.jpg';
import chemtechHero from '@/assets/chemtech-hero.jpg';

interface Product {
  id: string;
  name: string;
  brandName: string;
  technicalName: string;
  category: string;
  description: string;
  applications: string[];
  specifications?: string[];
  climate?: string[];
  useCase: string[];
  brand: string;
}

interface ProductVertical {
  id: string;
  name: string;
  tagline: string;
  icon: React.ComponentType<any>;
  heroImage: string;
  gradient: string;
  products: Product[];
}

const productsData: ProductVertical[] = [
  {
    id: 'roadbond',
    name: 'RoadBond™',
    tagline: 'Trusted Bitumen Technologies for Every Road',
    icon: Building2,
    heroImage: roadbondHero,
    gradient: 'from-violet-blue to-egyptian-blue',
    products: [
      {
        id: 'rb-001',
        name: 'TARFIX™ Premium Emulsion',
        brandName: 'TARFIX™',
        technicalName: 'Cationic Rapid Setting Emulsion CRS-1',
        category: 'Bitumen Emulsion',
        description: 'High-performance cationic emulsion for superior road surface treatment and maintenance applications.',
        applications: ['Tack Coat Application', 'Surface Dressing', 'Patch Repair'],
        specifications: ['Viscosity: 20-100 SFS', 'Residue: 60% min', 'Setting Time: 2-5 minutes'],
        climate: ['Hot Climate Area', 'Monsoon Resistant'],
        useCase: ['Slurry Seals', 'Cold Mix', 'Pothole Repair'],
        brand: 'TARFIX'
      },
      {
        id: 'rb-002',
        name: 'MIXWELL™ Hot Mix Additive',
        brandName: 'MIXWELL™',
        technicalName: 'Polymer Modified Bitumen PMB-40',
        category: 'Modified Bitumen',
        description: 'Advanced polymer-modified bitumen for high-traffic road construction and heavy-duty applications.',
        applications: ['Highway Construction', 'Airport Runways', 'Heavy Traffic Areas'],
        specifications: ['Penetration: 40-60 mm', 'Softening Point: 55°C min', 'Elastic Recovery: 75% min'],
        climate: ['All Weather', 'Temperature Resistant'],
        useCase: ['Hot Mix Asphalt', 'Wearing Course', 'Base Layer'],
        brand: 'MIXWELL'
      },
      {
        id: 'rb-003',
        name: 'COLDSET™ Rapid Cure',
        brandName: 'COLDSET™',
        technicalName: 'Medium Setting Emulsion MS-2',
        category: 'Cold Mix Solutions',
        description: 'Fast-setting emulsion designed for cold weather applications and emergency road repairs.',
        applications: ['Emergency Repairs', 'Winter Construction', 'Remote Area Applications'],
        specifications: ['Setting Time: 5-15 minutes', 'Storage Stability: 3 months', 'Workability: Extended'],
        climate: ['Cold Climate', 'Sub-Zero Performance'],
        useCase: ['Emergency Patching', 'Cold Weather Repairs', 'Maintenance'],
        brand: 'COLDSET'
      }
    ]
  },
  {
    id: 'rockgrid',
    name: 'RockGrid™',
    tagline: 'High-Strength Gabion Engineering Systems',
    icon: Shield,
    heroImage: rockgridHero,
    gradient: 'from-egyptian-blue to-deep-gray',
    products: [
      {
        id: 'rg-001',
        name: 'STRONGMESH™ Gabion Baskets',
        brandName: 'STRONGMESH™',
        technicalName: 'Galvanized Steel Wire Mesh Gabions',
        category: 'Gabion Systems',
        description: 'Heavy-duty galvanized steel wire mesh gabion baskets for retaining walls and erosion control.',
        applications: ['Retaining Walls', 'River Training', 'Slope Protection'],
        specifications: ['Wire Diameter: 2.7-4.0mm', 'Mesh Size: 80x100mm', 'Galvanization: 245g/m²'],
        climate: ['Corrosion Resistant', 'Weather Proof'],
        useCase: ['Soil Retention', 'Water Management', 'Landscape Architecture'],
        brand: 'STRONGMESH'
      },
      {
        id: 'rg-002',
        name: 'FLEXMAT™ Slope Protection',
        brandName: 'FLEXMAT™',
        technicalName: 'Articulated Concrete Block System',
        category: 'Slope Protection',
        description: 'Flexible concrete block system for challenging slope stabilization and channel lining projects.',
        applications: ['Channel Lining', 'Coastal Protection', 'Dam Spillways'],
        specifications: ['Block Thickness: 80-120mm', 'Flexibility: High', 'Flow Resistance: Optimized'],
        climate: ['Marine Environment', 'High Flow Resistance'],
        useCase: ['Erosion Control', 'Hydraulic Applications', 'Environmental Protection'],
        brand: 'FLEXMAT'
      },
      {
        id: 'rg-003',
        name: 'GEOGRID™ Reinforcement',
        brandName: 'GEOGRID™',
        technicalName: 'Biaxial Polypropylene Geogrid',
        category: 'Ground Reinforcement',
        description: 'High-strength biaxial geogrid for soil stabilization and pavement reinforcement applications.',
        applications: ['Pavement Reinforcement', 'Embankment Stabilization', 'Foundation Support'],
        specifications: ['Tensile Strength: 30-55 kN/m', 'Aperture Size: 25-35mm', 'Junction Efficiency: 95%'],
        climate: ['UV Stabilized', 'Chemical Resistant'],
        useCase: ['Load Distribution', 'Crack Prevention', 'Structural Support'],
        brand: 'GEOGRID'
      }
    ]
  },
  {
    id: 'chemtech',
    name: 'ChemTech™',
    tagline: 'Next-Gen Construction Chemicals, Made in India',
    icon: Beaker,
    heroImage: chemtechHero,
    gradient: 'from-amber to-egyptian-blue',
    products: [
      {
        id: 'ct-001',
        name: 'CONCURE™ Accelerator',
        brandName: 'CONCURE™',
        technicalName: 'Calcium Chloride Based Accelerator',
        category: 'Concrete Additives',
        description: 'High-performance concrete accelerator for rapid strength development in cold weather conditions.',
        applications: ['Winter Concreting', 'Rapid Construction', 'Precast Elements'],
        specifications: ['Chloride Content: 98% min', 'Setting Time Reduction: 30-50%', 'Strength Gain: 24hr accelerated'],
        climate: ['Cold Weather', 'Fast Track Construction'],
        useCase: ['Quick Setting', 'Early Strength', 'Time Sensitive Projects'],
        brand: 'CONCURE'
      },
      {
        id: 'ct-002',
        name: 'BONDTITE™ Epoxy System',
        brandName: 'BONDTITE™',
        technicalName: '2-Component Structural Epoxy Adhesive',
        category: 'Structural Adhesives',
        description: 'Two-component structural epoxy for concrete repair, anchoring, and bonding applications.',
        applications: ['Concrete Repair', 'Steel Anchoring', 'Structural Bonding'],
        specifications: ['Compressive Strength: 80 MPa', 'Bond Strength: 4 MPa', 'Working Time: 45 minutes'],
        climate: ['High Temperature Resistant', 'Chemical Resistant'],
        useCase: ['Structural Repairs', 'Load Transfer', 'Crack Injection'],
        brand: 'BONDTITE'
      },
      {
        id: 'ct-003',
        name: 'WATERLOCK™ Sealant',
        brandName: 'WATERLOCK™',
        technicalName: 'Polyurethane Based Waterproofing Compound',
        category: 'Waterproofing',
        description: 'Single-component polyurethane sealant for comprehensive waterproofing and joint sealing.',
        applications: ['Roof Waterproofing', 'Basement Sealing', 'Joint Treatment'],
        specifications: ['Elongation: 400%', 'Tensile Strength: 2.5 MPa', 'Shore A Hardness: 35'],
        climate: ['Weather Resistant', 'UV Stable'],
        useCase: ['Movement Joints', 'Weather Sealing', 'Waterproof Membrane'],
        brand: 'WATERLOCK'
      }
    ]
  }
];

const ProductsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roadbond');
  const [filterType, setFilterType] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterUse, setFilterUse] = useState('all');
  const [filterClimate, setFilterClimate] = useState('all');
  const [expandedSpecs, setExpandedSpecs] = useState<string[]>([]);
  const [compareProducts, setCompareProducts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleSpecs = (productId: string) => {
    setExpandedSpecs(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleCompare = (productId: string) => {
    setCompareProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 3) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  const getFilteredProducts = (products: Product[]) => {
    return products.filter(product => {
      if (filterType !== 'all' && !product.category.toLowerCase().includes(filterType)) return false;
      if (filterBrand !== 'all' && product.brand !== filterBrand) return false;
      if (filterUse !== 'all' && !product.useCase.some(use => use.toLowerCase().includes(filterUse))) return false;
      if (filterClimate !== 'all' && !product.climate?.some(climate => climate.toLowerCase().includes(filterClimate))) return false;
      return true;
    });
  };

  const allProducts = productsData.flatMap(vertical => vertical.products);
  const allBrands = [...new Set(allProducts.map(p => p.brand))];
  const allUses = [...new Set(allProducts.flatMap(p => p.useCase))];
  const allClimates = [...new Set(allProducts.flatMap(p => p.climate || []))];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-industrial text-deep-gray mb-4">
            Industrial-Grade Product Solutions
          </h2>
          <p className="text-xl text-onyx max-w-3xl mx-auto font-medium">
            Trusted infrastructure technologies engineered for contractors, engineers, and procurement professionals across India's most demanding projects.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {compareProducts.length > 0 && (
              <Button variant="default" className="flex items-center gap-2 bg-amber text-deep-gray hover:bg-amber/90">
                <GitCompare className="h-4 w-4" />
                Compare Selected ({compareProducts.length})
              </Button>
            )}
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="By Product Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bitumen">Bitumen</SelectItem>
                    <SelectItem value="gabion">Gabion</SelectItem>
                    <SelectItem value="concrete">Concrete</SelectItem>
                    <SelectItem value="adhesive">Adhesives</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBrand} onValueChange={setFilterBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="By Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {allBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}™</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterUse} onValueChange={setFilterUse}>
                  <SelectTrigger>
                    <SelectValue placeholder="By Use Case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Uses</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="waterproof">Waterproofing</SelectItem>
                    <SelectItem value="reinforcement">Reinforcement</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterClimate} onValueChange={setFilterClimate}>
                  <SelectTrigger>
                    <SelectValue placeholder="By Climate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Climates</SelectItem>
                    <SelectItem value="hot">Hot Climate</SelectItem>
                    <SelectItem value="cold">Cold Climate</SelectItem>
                    <SelectItem value="marine">Marine Environment</SelectItem>
                    <SelectItem value="weather">Weather Resistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Product Verticals */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1 bg-muted">
            {productsData.map((vertical) => {
              const Icon = vertical.icon;
              return (
                <TabsTrigger 
                  key={vertical.id} 
                  value={vertical.id}
                  className="flex flex-col items-center gap-2 py-4 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-bold text-lg">{vertical.name}</div>
                    <div className="text-sm opacity-80 hidden md:block">{vertical.tagline}</div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {productsData.map((vertical) => (
            <TabsContent key={vertical.id} value={vertical.id} className="mt-0">
              {/* Vertical Hero */}
              <div className={`relative rounded-lg overflow-hidden mb-8 bg-gradient-to-r ${vertical.gradient}`}>
                <div className="absolute inset-0 opacity-30">
                  <img 
                    src={vertical.heroImage} 
                    alt={vertical.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative z-10 p-8 md:p-12 text-white">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">{vertical.name}</h3>
                  <p className="text-xl mb-6 opacity-90">{vertical.tagline}</p>
                  <Button variant="secondary" className="bg-amber text-deep-gray hover:bg-amber/90">
                    <Download className="h-4 w-4 mr-2" />
                    Download Category Brochure
                  </Button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredProducts(vertical.products).map((product) => (
                  <Card key={product.id} className="group hover:shadow-elevated transition-all duration-300 border-border hover:border-primary/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2 text-xs bg-gradient-accent">
                            {product.brandName}
                          </Badge>
                          <CardTitle className="text-lg font-bold text-deep-gray group-hover:text-primary transition-colors">
                            {product.name}
                          </CardTitle>
                          <p className="text-sm text-onyx font-medium">{product.technicalName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCompare(product.id)}
                          className={`p-2 ${compareProducts.includes(product.id) ? 'bg-amber text-deep-gray' : ''}`}
                          disabled={!compareProducts.includes(product.id) && compareProducts.length >= 3}
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-foreground">{product.description}</p>
                      
                      {/* Applications */}
                      <div>
                        <h5 className="font-semibold text-sm text-deep-gray mb-2">Primary Applications:</h5>
                        <div className="flex flex-wrap gap-1">
                          {product.applications.map((app, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Use Cases Preview */}
                      <div className="border-t pt-3">
                        <div className="text-xs text-onyx">
                          <span className="font-medium">Recommended for:</span> {product.useCase.slice(0, 2).join(', ')}
                          {product.useCase.length > 2 && '...'}
                        </div>
                      </div>

                      {/* Expandable Specifications */}
                      <Collapsible 
                        open={expandedSpecs.includes(product.id)} 
                        onOpenChange={() => toggleSpecs(product.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-0 h-auto font-medium text-primary">
                            Show All Specs & Recommendations
                            {expandedSpecs.includes(product.id) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-3">
                          {product.specifications && (
                            <div>
                              <h6 className="font-semibold text-sm text-deep-gray mb-1">Technical Specifications:</h6>
                              <ul className="text-xs text-foreground space-y-1">
                                {product.specifications.map((spec, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="inline-block w-1 h-1 bg-primary rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                    {spec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {product.climate && (
                            <div>
                              <h6 className="font-semibold text-sm text-deep-gray mb-1">Climate Suitability:</h6>
                              <div className="flex flex-wrap gap-1">
                                {product.climate.map((climate, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary">
                                    {climate}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h6 className="font-semibold text-sm text-deep-gray mb-1">All Use Cases:</h6>
                            <div className="flex flex-wrap gap-1">
                              {product.useCase.map((use, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {use}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-1" />
                          TDS
                        </Button>
                        <Button size="sm" variant="default" className="flex-1 bg-primary hover:bg-primary-dark">
                          Enquire Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {getFilteredProducts(vertical.products).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No products match the selected filters.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilterType('all');
                      setFilterBrand('all');
                      setFilterUse('all');
                      setFilterClimate('all');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default ProductsSection;