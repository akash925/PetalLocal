import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flower2, MapPin, DollarSign, Package, Search } from "lucide-react";
import { useState } from "react";

interface Flower {
  id: number;
  name: string;
  description: string;
  category: string;
  variety: string;
  pricePerUnit: number;
  unit: string;
  imageUrl: string;
  isOrganic: boolean;
  isSeasonal: boolean;
  farmId: number;
  farmName: string;
  farmCity: string;
  farmState: string;
  quantityAvailable: number;
  isActive: boolean;
  createdAt: string;
}

export default function FlowersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: flowers, isLoading } = useQuery<Flower[]>({
    queryKey: ["/api/flowers", { admin: true }],
  });

  const filteredFlowers = flowers?.filter(flower => {
    const matchesSearch = flower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flower.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flower.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || flower.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && flower.isActive) ||
                         (statusFilter === "inactive" && !flower.isActive) ||
                         (statusFilter === "out_of_stock" && flower.quantityAvailable === 0);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(flowers?.map(f => f.category) || [])];
  const totalValue = flowers?.reduce((sum, flower) => sum + (Number(flower.pricePerUnit || 0) * Number(flower.quantityAvailable || 0)), 0) || 0;
  const avgPrice = flowers?.length ? flowers.reduce((sum, f) => sum + Number(f.pricePerUnit || 0), 0) / flowers.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Flower2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flowers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {flowers?.filter(f => f.isActive).length || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total marketplace value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgPrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per unit average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Flower2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Flower varieties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="luxury-heading">All Flower Listings</CardTitle>
          <CardDescription>Monitor and manage marketplace inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flowers, farms, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flower</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlowers?.map((flower) => (
                  <TableRow key={flower.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={flower.imageUrl || '/api/placeholder/40/40'}
                          alt={flower.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium">{flower.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {flower.variety}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flower.farmName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {flower.farmCity}, {flower.farmState}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {flower.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(flower.pricePerUnit || 0).toFixed(2)}/{flower.unit}
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${
                        flower.quantityAvailable === 0 ? 'text-red-600' : 
                        flower.quantityAvailable < 10 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {flower.quantityAvailable} {flower.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={flower.isActive ? "default" : "secondary"}>
                          {flower.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {flower.isOrganic && (
                          <Badge variant="outline" className="text-green-600">Organic</Badge>
                        )}
                        {flower.isSeasonal && (
                          <Badge variant="outline" className="text-blue-600">Seasonal</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}