import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useEffect } from "react";

// Pages
import Home from "@/pages/home";
import BrowseProduce from "@/pages/produce/browse";
import ProduceDetailPage from "@/pages/produce/[id]";
import ProduceDetail from "@/pages/produce-detail";
import BrowseFarms from "@/pages/farms/browse";
import FarmDetail from "@/pages/farms/[id]";
import Cart from "@/pages/cart";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import GrowerDashboard from "@/pages/dashboard/grower";
import AdminDashboard from "@/pages/admin/dashboard";
import OrderHistory from "@/pages/orders";
import Messages from "@/pages/messages";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import OrderTracking from "@/pages/order-tracking";
import Sell from "@/pages/sell";
import SellProduce from "@/pages/sell-produce";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/browse-produce" component={BrowseProduce} />
          <Route path="/produce" component={BrowseProduce} />
          <Route path="/produce/browse" component={BrowseProduce} />
          <Route path="/produce/:id" component={ProduceDetail} />
          <Route path="/flowers" component={BrowseProduce} />
          <Route path="/flowers/browse" component={BrowseProduce} />
          <Route path="/flowers/:id" component={ProduceDetail} />
          <Route path="/farms" component={BrowseFarms} />
          <Route path="/farms/:id" component={FarmDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-confirmation" component={OrderConfirmation} />
          <Route path="/orders/:id" component={OrderTracking} />
          <Route path="/order-tracking" component={OrderTracking} />
          <Route path="/orders" component={OrderHistory} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Register} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route path="/auth/signup" component={Register} />
          <Route path="/dashboard/grower" component={GrowerDashboard} />
          <Route path="/dashboard/farmer" component={GrowerDashboard} />
          <Route path="/dashboard/admin" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/messages" component={Messages} />
          <Route path="/sell" component={Sell} />
          <Route path="/sell-produce" component={SellProduce} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
