import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { products } from '../../data/mockData';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  Search,
  ShoppingCart,
  FileText,
  Clock,
  Layers,
  Upload,
  FileImage,
  Award,
  Check,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  User,
  MapPin,
  HelpCircle,
  Truck,
  Store,
  ExternalLink,
  Instagram
} from 'lucide-react';

export function ClientLanding() {
  const navigate = useNavigate();
  const { createCatalogOrder, createCustomOrder, orders } = useApp();

  // Navigation search state
  const [trackingSearch, setTrackingSearch] = useState('');

  // Catalog tab filtering state
  const [selectedTab, setSelectedTab] = useState<'all' | 'Vasos' | 'Llaveros' | 'Medallas'>('all');

  // Catalog order checkout modal state
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [catalogQty, setCatalogQty] = useState(1);
  const [catalogMaterial, setCatalogMaterial] = useState('PLA');
  const [catalogColor, setCatalogColor] = useState('Blanco');
  const [catalogDelivery, setCatalogDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [catalogAddress, setCatalogAddress] = useState('');
  const [catalogNotes, setCatalogNotes] = useState('');
  
  // Client contact info for catalog checkout
  const [catalogName, setCatalogName] = useState('');
  const [catalogEmail, setCatalogEmail] = useState('');
  const [catalogPhone, setCatalogPhone] = useState('');

  // Custom order form state
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customType, setCustomType] = useState('1'); // 1: Figura Decorativa, etc.
  const [customDesc, setCustomDesc] = useState('');
  const [customFiles, setCustomFiles] = useState<File[]>([]);
  const [customFilePreviews, setCustomFilePreviews] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState(false);
  const [customMaterial, setCustomMaterial] = useState('PLA');
  const [customMaterialMult, setCustomMaterialMult] = useState(1.0);
  const [customColor, setCustomColor] = useState('Blanco');
  const [customFinish, setCustomFinish] = useState('1'); // multiplier as string
  const [customQty, setCustomQty] = useState(1);

  // Success screen modal
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Search tracking logic
  const handleTrackingLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = trackingSearch.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Por favor, ingresá un código de pedido.');
      return;
    }
    
    // Check if the order exists in our state
    const foundOrder = orders.find(o => o.id.toUpperCase() === cleanCode);
    if (foundOrder) {
      toast.success(`Pedido encontrado: redirigiendo...`);
      navigate(`/client/orders/${foundOrder.id}`);
    } else {
      toast.error(`Código de pedido "${cleanCode}" no encontrado.`);
    }
  };

  // Catalog filter
  const filteredProducts = products.filter(p => {
    if (selectedTab === 'all') return true;
    return p.category === selectedTab;
  });

  // Open catalog modal
  const openCatalogCheckout = (product: any) => {
    setSelectedProduct(product);
    setCatalogQty(1);
    setCatalogMaterial(product.material);
    setCatalogColor('Blanco');
    setCatalogDelivery('pickup');
    setCatalogAddress('');
    setCatalogNotes('');
    setCatalogName('');
    setCatalogEmail('');
    setCatalogPhone('');
    setIsCatalogModalOpen(true);
  };

  // Submit catalog order
  const handleCatalogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!catalogName.trim()) {
      toast.error('Por favor, ingresá tu nombre completo.');
      return;
    }
    if (!catalogEmail.trim()) {
      toast.error('Por favor, ingresá tu email.');
      return;
    }
    if (catalogDelivery === 'delivery' && !catalogAddress.trim()) {
      toast.error('Por favor, ingresá la dirección de entrega.');
      return;
    }

    const newOrder = createCatalogOrder(
      selectedProduct.id,
      selectedProduct.name,
      catalogQty,
      catalogMaterial,
      catalogColor,
      catalogDelivery,
      catalogAddress,
      catalogNotes,
      catalogName,
      catalogEmail,
      catalogPhone
    );

    setCreatedOrderCode(newOrder.id);
    setIsSuccessModalOpen(true);

    // Simular el envío de correo silencioso al Gmail del cliente
    console.log(`%c[SIMULACIÓN EMAIL] Correo enviado exitosamente a ${catalogEmail} con el código de seguimiento: ${newOrder.id}`, 'color: #22c55e; font-weight: bold;');

    // Reset fields
    setCatalogQty(1);
    setCatalogMaterial('PLA');
    setCatalogColor('Blanco');
    setCatalogDelivery('pickup');
    setCatalogAddress('');
    setCatalogNotes('');
    setCatalogName('');
    setCatalogEmail('');
    setCatalogPhone('');
    setIsCatalogModalOpen(false);
  };

  // File Upload with validation (format & size)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
      
      const validFiles: File[] = [];
      const previews: string[] = [];

      for (const file of selectedFiles) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isValidExtension = ['jpg', 'jpeg', 'png'].includes(extension || '');
        const isValidMime = allowedTypes.includes(file.type);
        
        if (!isValidExtension && !isValidMime) {
          toast.error(`Formato no válido: "${file.name}". Solo se admiten archivos JPG, JPEG o PNG.`);
          alert(`Exceso de peso o formato no válido: El formato del archivo "${file.name}" no es compatible. Solo se permiten archivos JPG, JPEG o PNG.`);
          setCustomFiles([]);
          setCustomFilePreviews([]);
          e.target.value = ''; // clear input
          return;
        }

        if (file.size > maxSizeBytes) {
          toast.error(`El archivo "${file.name}" supera los 5 MB.`);
          alert(`Exceso de peso o formato no válido: El archivo "${file.name}" supera el límite de 5 MB de tamaño de subida.`);
          setCustomFiles([]);
          setCustomFilePreviews([]);
          e.target.value = ''; // clear input
          return;
        }

        validFiles.push(file);
        previews.push(URL.createObjectURL(file));
      }

      setCustomFiles(validFiles);
      setCustomFilePreviews(previews);
      setUploadError(false);
      toast.success(`${validFiles.length} archivo(s) cargado(s) con éxito.`);
    }
  };

  // Submit custom order
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customName.trim()) {
      toast.error('Por favor, ingresá tu nombre completo.');
      return;
    }
    if (!customEmail.trim()) {
      toast.error('Por favor, ingresá tu email.');
      return;
    }

    if (!customDesc.trim()) {
      toast.error('Por favor, describí tu proyecto.');
      return;
    }

    const typeNames = [
      'Figura decorativa',
      'Repuesto / pieza técnica',
      'Prototipo funcional',
      'Joyería o accesorio',
      'Maqueta arquitectónica',
      'Otro'
    ];
    const typeIdx = parseInt(customType) - 1;
    const pieceTypeName = typeNames[typeIdx] || 'Pieza Personalizada';

    // Helper to read files as base64
    const readFilesAsBase64 = async (files: File[]): Promise<string[]> => {
      const promises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
        });
      });
      return Promise.all(promises);
    };

    try {
      const base64Files = await readFilesAsBase64(customFiles);

      const newOrder = createCustomOrder(
        pieceTypeName,
        customMaterial,
        customColor,
        customQty,
        customDesc,
        base64Files,
        customName,
        customEmail,
        customPhone
      );

      setCreatedOrderCode(newOrder.id);
      setIsSuccessModalOpen(true);

      // Simular el envío de correo silencioso al Gmail del cliente
      console.log(`%c[SIMULACIÓN EMAIL] Correo enviado exitosamente a ${customEmail} con el código de seguimiento: ${newOrder.id}`, 'color: #22c55e; font-weight: bold;');

      // Reset Form
      setCustomName('');
      setCustomEmail('');
      setCustomPhone('');
      setCustomType('1');
      setCustomDesc('');
      setCustomFiles([]);
      setCustomFilePreviews([]);
      setCustomMaterial('PLA');
      setCustomMaterialMult(1.0);
      setCustomColor('Blanco');
      setCustomFinish('1');
      setCustomQty(1);
      setUploadError(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar los archivos de imagen. Intente de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#f0f0f5] selection:bg-[#FF1744]/30 selection:text-[#FFFFFF] overflow-x-hidden font-['DM_Sans',_sans-serif]">
      {/* Dynamic keyframes & custom styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .carousel-track-anim {
          display: flex;
          gap: 1.25rem;
          animation: scroll 35s linear infinite;
          width: max-content;
        }
        .carousel-track-anim:hover {
          animation-play-state: paused;
        }
        .neon-glow-red {
          text-shadow: 0 0 20px rgba(255, 23, 68, 0.4);
        }
        .neon-glow-blue {
          text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
        }
        .neon-border-custom:hover {
          border-color: rgba(255, 23, 68, 0.4);
          box-shadow: 0 0 15px rgba(255, 23, 68, 0.1);
        }
        .neon-border-purple:hover {
          border-color: rgba(124, 58, 237, 0.4);
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.1);
        }
        .mat-card-pulse {
          transition: all 0.2s ease;
        }
        .mat-card-pulse:hover {
          transform: translateY(-2px);
        }
        .icon-tilt {
          transition: transform 0.3s ease;
        }
        .icon-tilt:hover {
          transform: rotate(15deg) scale(1.15);
        }
        .icon-pulse {
          animation: pulse-glow 2s infinite alternate;
        }
        @keyframes pulse-glow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 23, 68, 0.6)); }
        }
      `}} />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="J3D Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-[#FF1744]/15" />
          <div>
            <h1 className="text-white font-semibold text-lg leading-none m-0 font-['Bebas_Neue',_sans-serif] tracking-wider">
              J3D<span className="text-[#FF1744]"> IMPRESIONES</span>
            </h1>
            <p className="text-[#A0A0A0] text-[9px] tracking-widest uppercase m-0 mt-0.5">Catálogo & Personalizados</p>
          </div>
        </div>

        {/* Center Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#productos" className="text-sm font-medium text-[#8888aa] hover:text-[#FF1744] transition-colors no-underline">Productos</a>
          <a href="#personalizado" className="text-sm font-medium text-[#8888aa] hover:text-[#7c3aed] transition-colors no-underline">Pedido Personalizado</a>
          <a href="#proceso" className="text-sm font-medium text-[#8888aa] hover:text-white transition-colors no-underline">Cómo funciona</a>
          <a href="#contacto" className="text-sm font-medium text-[#8888aa] hover:text-white transition-colors no-underline">Contacto</a>
        </nav>

        {/* Right Section: Tracking Search form */}
        <form onSubmit={handleTrackingLookup} className="flex items-center gap-2 max-w-xs w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888aa]" />
            <input
              type="text"
              placeholder="Código de pedido..."
              value={trackingSearch}
              onChange={(e) => setTrackingSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#14141c] border border-white/10 rounded-lg text-xs text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#FF1744] focus:ring-1 focus:ring-[#FF1744]/30 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#FF1744] hover:bg-[#D50032] text-xs font-bold text-white rounded-lg transition-all shadow-md shadow-[#FF1744]/20"
          >
            Buscar
          </button>
        </form>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#7c3aed]/10 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#FF1744]/10 border border-[#FF1744]/30 text-[#FF1744] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            ⚡ Impresión 3D Profesional — Vasos, Llaveros y Mates
          </div>
          
          <h2 className="text-white font-black leading-none font-['Bebas_Neue',_sans-serif] tracking-wider text-5xl sm:text-7xl lg:text-8xl">
            OBJETOS ÚNICOS<br />
            <span className="text-[#FF1744] neon-glow-red">IMPRESOS EN 3D</span><br />
            PARA VOS
          </h2>

          <p className="text-[#8888aa] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Elegí tus mates de Stitch, llaveros personalizados o vasos chopp directamente desde nuestro catálogo estándar o cargá tu diseño para cotizar una pieza única.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#personalizado"
              className="px-6 py-3.5 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:opacity-95 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#7c3aed]/20 no-underline flex items-center gap-2"
            >
              <FileText className="w-4 h-4 animate-pulse" />
              Crear pedido personalizado
            </a>
            <a
              href="#productos"
              className="px-6 py-3.5 bg-[#14141c] hover:bg-[#1c1c28] border border-white/10 text-[#f0f0f5] text-sm font-medium rounded-xl transition-all no-underline flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 text-[#FF1744]" />
              Ver catálogo
            </a>
          </div>
        </div>
      </section>

      {/* INFINITE PRODUCT CAROUSEL */}
      <section className="py-6 border-y border-white/5 bg-[#14141c]/30">
        <div className="overflow-hidden relative w-full">
          {/* Overlay gradients for fade effect */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0A0A0F] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0A0A0F] to-transparent z-10 pointer-events-none" />
          
          <div className="carousel-track-anim">
            {/* Products items (duplicated for loop) */}
            {[
              { icon: '🥤', name: 'Mate Stitch J3D', price: '$15.000' },
              { icon: '🥤', name: 'Vaso Chopp River', price: '$10.000' },
              { icon: '🔑', name: 'Llavero CARP River', price: '$1.200' },
              { icon: '🥤', name: 'Vaso Chopp GyE', price: '$10.000' },
              { icon: '🥤', name: 'Mate Capibara J3D', price: '$12.000' },
              { icon: '🏆', name: 'Medalla Laureano', price: '$1.200' },
              // Duplicate set
              { icon: '🥤', name: 'Mate Stitch J3D', price: '$15.000' },
              { icon: '🥤', name: 'Vaso Chopp River', price: '$10.000' },
              { icon: '🔑', name: 'Llavero CARP River', price: '$1.200' },
              { icon: '🥤', name: 'Vaso Chopp GyE', price: '$10.000' },
              { icon: '🥤', name: 'Mate Capibara J3D', price: '$12.000' },
              { icon: '🏆', name: 'Medalla Laureano', price: '$1.200' }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-[#16161f] border border-white/5 rounded-xl px-5 py-4 w-48 shrink-0 flex items-center gap-3 hover:border-[#FF1744]/40 hover:scale-105 transition-all cursor-pointer group"
              >
                <span className="text-3xl icon-tilt group-hover:animate-bounce">{item.icon}</span>
                <div>
                  <h4 className="text-[11px] font-bold text-white truncate w-28">{item.name}</h4>
                  <p className="text-xs font-semibold text-[#FF1744] mt-0.5">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-[10px] text-[#8888aa] mt-3 tracking-widest uppercase">
          Arrastrá o pasá el mouse para pausar
        </p>
      </section>

      {/* CATALOG GRID */}
      <section id="productos" className="py-20 px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center sm:text-left space-y-2">
          <h2 className="text-white font-extrabold text-3xl font-['Bebas_Neue',_sans-serif] tracking-wider">
            CATÁLOGO ESTÁNDAR
          </h2>
          <p className="text-[#8888aa] text-sm max-w-md">
            Productos estandarizados optimizados para impresión rápida y alta durabilidad.
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
          {[
            { id: 'all', label: 'Todos los productos' },
            { id: 'Vasos', label: '🥤 Vasos y Mates' },
            { id: 'Llaveros', label: '🔑 Llaveros' },
            { id: 'Medallas', label: '🏆 Medallas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedTab === tab.id
                  ? 'bg-[#FF1744] text-white border-[#FF1744] shadow-lg shadow-[#FF1744]/25'
                  : 'bg-[#14141c] text-[#8888aa] border-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            // Pick catalog icon emoji based on category
            const emoji = product.category === 'Vasos' ? '🥤' : product.category === 'Llaveros' ? '🔑' : '🏆';
            const badgeText = product.id === 'p1' ? 'Popular' : (product.id === 'p2' || product.id === 'p5' || product.id === 'p6') ? 'Nuevo' : 'Promo';
            const badgeColor = badgeText === 'Popular' ? 'bg-[#f97316]' : badgeText === 'Nuevo' ? 'bg-[#22c55e]' : 'bg-[#7c3aed]';

            return (
              <Card
                key={product.id}
                className="overflow-hidden border border-white/5 bg-[#16161f] p-0 flex flex-col justify-between hover:border-[#FF1744]/40 hover:-translate-y-1.5 transition-all group"
              >
                {/* Image / Icon Container */}
                <div className="aspect-video w-full bg-[#1c1c28] flex items-center justify-center relative select-none overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-6xl icon-tilt group-hover:scale-125 group-hover:animate-bounce inline-block">
                      {emoji}
                    </span>
                  )}
                  
                  <span className={`absolute top-4 right-4 ${badgeColor} text-[10px] font-extrabold text-white uppercase tracking-wider px-2.5 py-1 rounded-md shadow-lg`}>
                    {badgeText}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">{product.category}</p>
                    <h3 className="text-white text-lg font-bold group-hover:text-[#FF1744] transition-colors">{product.name}</h3>
                    <p className="text-[#8888aa] text-xs leading-relaxed line-clamp-2">{product.description}</p>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-[#8888aa] block uppercase">Precio Base</span>
                      <span className="text-[#FF1744] text-xl font-bold font-sans">
                        ${product.basePrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openCatalogCheckout(product)}
                      className="px-5 py-2 text-xs font-bold bg-[#FF1744] hover:bg-[#D50032] text-white rounded-lg flex items-center gap-1 shadow-md shadow-[#FF1744]/20"
                    >
                      Solicitar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CUSTOM ORDERS SECTION */}
      <section id="personalizado" className="py-20 bg-[#14141c]/50 border-y border-white/5">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-white font-extrabold text-4xl sm:text-5xl font-['Bebas_Neue',_sans-serif] tracking-wider uppercase">
              Crea tu producto <span className="text-[#7c3aed]">personalizado</span>
            </h2>
          </div>

          {/* Custom order form card */}
          <div className="bg-[#16161f] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl relative">

            <form onSubmit={handleCustomSubmit} className="space-y-6">
              
              {/* Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Nombre Completo *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888aa]" />
                    <input
                      type="text"
                      placeholder="Ej: Sofía Martínez"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-sm text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#7c3aed] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Email de Contacto *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888aa]" />
                    <input
                      type="email"
                      placeholder="Ej: sofia@mail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-sm text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#7c3aed] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">WhatsApp / Celular</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888aa]" />
                    <input
                      type="tel"
                      placeholder="Ej: +54 9 11 1234-5678"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-sm text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#7c3aed] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Tipo de Proyecto</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#7c3aed] transition-all"
                  >
                    <option value="1">Figura decorativa</option>
                    <option value="2">Repuesto / pieza técnica</option>
                    <option value="3">Prototipo funcional</option>
                    <option value="4">Joyería o accesorio</option>
                    <option value="5">Maqueta arquitectónica</option>
                    <option value="6">Otro</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Descripción detallada del pedido *</label>
                <textarea
                  placeholder="Detallá las dimensiones deseadas, el uso que tendrá, colores específicos, cantidad y cualquier requerimiento mecánico o visual..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1c1c28] border border-white/5 rounded-xl text-sm text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#7c3aed] transition-all h-24"
                  required
                />
              </div>

              {/* Upload area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">
                  Adjuntar Archivos / Diseños <span className="text-[#8888aa] font-semibold">(Opcional - JPG/PNG, máx 5MB)</span>
                </label>
                <div
                  id="upload-area-container"
                  className="relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#1c1c28]/40 border-white/5 hover:border-[#7c3aed] hover:bg-[#7c3aed]/5"
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/jpg"
                  />
                  <Upload className="w-8 h-8 text-[#8888aa] mx-auto mb-2 icon-tilt" />
                  <p className="text-xs text-white font-semibold">Hacé clic o arrastrá tus archivos acá</p>
                  <p className="text-[10px] text-[#8888aa] mt-1">Imágenes (.png, .jpg, .jpeg) — Máx 5MB por archivo</p>
                </div>

                {customFilePreviews.length > 0 && (
                  <div className="mt-3 space-y-2 bg-[#1c1c28] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">Vista previa de imágenes:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                      {customFilePreviews.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-[#14141c]">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/75 px-1 py-0.5 rounded text-[8px] text-[#4ADE80] font-mono">
                            {customFiles[idx] ? (customFiles[idx].size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <p className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">Nombres de archivo:</p>
                      {customFiles.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] text-white">
                          <FileImage className="w-3.5 h-3.5 text-[#7c3aed]" />
                          <span className="truncate max-w-xs">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Swatch row & Finish grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Color principal</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Blanco', bg: '#f0f0f5' },
                      { name: 'Negro', bg: '#1a1a2e' },
                      { name: 'Gris', bg: '#6b7280' },
                      { name: 'Cian', bg: '#00e5ff' },
                      { name: 'Violeta', bg: '#7c3aed' },
                      { name: 'Naranja', bg: '#f97316' },
                      { name: 'Verde', bg: '#22c55e' },
                      { name: 'Rojo', bg: '#ef4444' },
                      { name: 'Amarillo', bg: '#eab308' },
                      { name: 'Rosa', bg: '#ec4899' },
                      { name: 'Dorado', bg: 'linear-gradient(135deg,#ffd700,#b8860b)' }
                    ].map((col) => (
                      <div
                        key={col.name}
                        onClick={() => setCustomColor(col.name)}
                        style={{ background: col.bg }}
                        title={col.name}
                        className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-all hover:scale-110 flex items-center justify-center ${
                          customColor === col.name ? 'border-white scale-105 shadow-md shadow-[#7c3aed]/50' : 'border-transparent'
                        }`}
                      >
                        {customColor === col.name && <Check className="w-3 h-3 text-black font-bold" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Terminación</label>
                  <select
                    value={customFinish}
                    onChange={(e) => setCustomFinish(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="1">Sin postprocesado</option>
                    <option value="1.2">Lijado suave</option>
                    <option value="1.5">Pintado unicolor</option>
                    <option value="2.0">Pintado multicolor + laca</option>
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div className="w-32 space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                  required
                />
              </div>

              {/* Presupuesto widget without showing price */}
              <div className="p-5 bg-[#7c3aed]/5 border border-[#7c3aed]/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#a78bfa] font-extrabold uppercase block tracking-widest">Presupuesto del Taller</span>
                  <span className="text-white text-xl font-bold font-['Bebas_Neue',_sans-serif] tracking-wider leading-none block">
                    Cotización Pendiente de Análisis
                  </span>
                  <p className="text-[10px] text-[#8888aa] leading-relaxed max-w-sm">
                    El operador de J3D evaluará tu modelo 3D y especificaciones para enviarte un desglose de costos detallado en menos de 24 horas.
                  </p>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3.5 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-lg shadow-[#7c3aed]/20 shrink-0 flex items-center justify-center gap-2"
                >
                  🚀 Solicitar Cotización
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS PROCESS SECTION */}
      <section id="proceso" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-white font-extrabold text-3xl font-['Bebas_Neue',_sans-serif] tracking-wider">
            ¿CÓMO FUNCIONA?
          </h2>
          <p className="text-[#8888aa] text-sm max-w-md mx-auto">
            El flujo de tu pedido, desde el formulario web hasta tus manos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Completás tu Pedido', desc: 'Elegís un diseño de nuestro catálogo o nos mandás la foto o archivo del producto personalizado que querés hacer.' },
            { step: '02', title: 'Revisamos tu Idea', desc: 'Revisamos lo que nos pediste y en menos de 24 horas te mandamos la cotización del producto.' },
            { step: '03', title: 'Pagás la Seña (50%)', desc: 'Aceptás el presupuesto en nuestra web y abonás la mitad para que empecemos a fabricarlo.' },
            { step: '04', title: 'Recibís tu Producto', desc: 'Una vez listo y pagado el total, lo retirás por nuestro taller o te lo enviamos a tu casa.' }
          ].map((s, idx) => (
            <div
              key={idx}
              className="bg-[#16161f] border border-white/5 rounded-2xl p-6 relative group hover:border-[#FF1744]/30 hover:-translate-y-1 transition-all"
            >
              <span className="text-[#FF1744]/20 font-black text-6xl font-['Bebas_Neue',_sans-serif] absolute right-6 top-4 group-hover:text-[#FF1744]/30 select-none">
                {s.step}
              </span>
              <div className="space-y-2 relative z-10">
                <h4 className="text-white text-sm font-bold mt-4">{s.title}</h4>
                <p className="text-[#8888aa] text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER & CONTACT */}
      <footer id="contacto" className="border-t border-white/5 bg-[#14141c]/20 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="text-white font-extrabold text-xl font-['Bebas_Neue',_sans-serif] tracking-wider">
              J3D<span className="text-[#FF1744]"> IMPRESIONES</span>
            </h4>
            <p className="text-xs text-[#8888aa]">📍 Los Alisos, Jujuy, Argentina — © 2026 J3D. Todos los derechos reservados.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-[#8888aa]">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#FF1744]" />
              <span>j3d@gmail.com</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-[#FF1744]" />
              <span>j3d.arg</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL: CHECKOUT DE PRODUCTO DE CATÁLOGO (RF02) */}
      {selectedProduct && (
        <Modal
          isOpen={isCatalogModalOpen}
          onClose={() => setIsCatalogModalOpen(false)}
          title={`Solicitar: ${selectedProduct.name}`}
          size="md"
        >
          <form onSubmit={handleCatalogSubmit} className="space-y-4">
            
            {/* Contact info for guest order */}
            <div className="bg-[#14141c]/50 p-4 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Información de Contacto</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={catalogName}
                    onChange={(e) => setCatalogName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#FF1744]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">Email *</label>
                  <input
                    type="email"
                    placeholder="Ej: juan@example.com"
                    value={catalogEmail}
                    onChange={(e) => setCatalogEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#FF1744]"
                    required
                  />
                </div>
              </div>

              <div className="w-full sm:w-1/2 space-y-1">
                <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">WhatsApp / Celular</label>
                <input
                  type="tel"
                  placeholder="Ej: +54 9 11 1234-5678"
                  value={catalogPhone}
                  onChange={(e) => setCatalogPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#FF1744]"
                />
              </div>
            </div>

            {/* Order detail configurations */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">Cantidad</label>
              <input
                type="number"
                min="1"
                value={catalogQty}
                onChange={(e) => setCatalogQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">Color principal</label>
                <select
                  value={catalogColor}
                  onChange={(e) => setCatalogColor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF1744]"
                >
                  <option value="Blanco">Blanco</option>
                  <option value="Negro">Negro</option>
                  <option value="Gris">Gris</option>
                  <option value="Rojo">Rojo</option>
                  <option value="Azul">Azul</option>
                  <option value="Verde">Verde</option>
                  <option value="Dorado">Dorado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest">Entrega</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatalogDelivery('pickup')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      catalogDelivery === 'pickup'
                        ? 'bg-[#FF1744] text-white border-[#FF1744]'
                        : 'bg-[#1c1c28] text-[#8888aa] border-white/5 hover:text-white'
                    }`}
                  >
                    <Store className="w-3 h-3" />
                    Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogDelivery('delivery')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      catalogDelivery === 'delivery'
                        ? 'bg-[#FF1744] text-white border-[#FF1744]'
                        : 'bg-[#1c1c28] text-[#8888aa] border-white/5 hover:text-white'
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                    Envío
                  </button>
                </div>
              </div>
            </div>

            {catalogDelivery === 'delivery' && (
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Dirección de entrega *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888aa]" />
                  <input
                    type="text"
                    placeholder="Calle, Altura, Departamento, Código Postal, Provincia"
                    value={catalogAddress}
                    onChange={(e) => setCatalogAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white placeholder:text-[#8888aa] focus:outline-none focus:border-[#FF1744]"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#8888aa] uppercase tracking-widest block">Notas / Observaciones</label>
              <textarea
                placeholder="Aclaración adicional sobre el grabado o detalles del producto..."
                value={catalogNotes}
                onChange={(e) => setCatalogNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#1c1c28] border border-white/5 rounded-xl text-xs text-white placeholder:text-[#8888aa] h-16 focus:outline-none focus:border-[#FF1744]"
              />
            </div>

            {/* Total Price & Submit */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8888aa] uppercase block">Total Estimado</span>
                <span className="text-[#FF1744] text-2xl font-bold font-sans">
                  ${(selectedProduct.basePrice * catalogQty).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-[#FF1744] hover:bg-[#D50032] text-xs font-bold"
                >
                  Confirmar Pedido
                </Button>
              </div>
            </div>

          </form>
        </Modal>
      )}


      {/* MODAL: SUCCESS DE PEDIDO CREADO */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="🎉 ¡Pedido Colocado Exitosamente!"
        size="sm"
      >
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-green-500/20 animate-bounce">
            ✓
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-[#8888aa]">
              Tu pedido ha sido registrado en el sistema. Guardá el siguiente código de seguimiento para consultar su progreso y adjuntar comprobantes de pago:
            </p>
            <div className="bg-[#14141c] border border-white/10 rounded-xl py-3 px-4 flex items-center justify-center gap-2 select-all">
              <span className="text-[#22c55e] font-mono text-lg font-bold tracking-wider">
                {createdOrderCode}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#1c1c28] border border-white/5 rounded-xl text-left text-xs text-[#8888aa] space-y-1">
            <span className="font-bold text-white block mb-0.5">📌 ¿Cuáles son los próximos pasos?</span>
            <p>1. Ingresá a la pantalla de seguimiento del pedido.</p>
            <p>2. Si es de catálogo, podés pagar la seña del 50% y subir el comprobante en la web.</p>
            <p>3. Si es personalizado, esperá que revisemos tu idea y te enviemos la cotización del producto en menos de 24 horas.</p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuccessModalOpen(false)}
              className="text-xs"
            >
              Volver al inicio
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsSuccessModalOpen(false);
                if (createdOrderCode) navigate(`/client/orders/${createdOrderCode}`);
              }}
              className="bg-[#FF1744] hover:bg-[#D50032] text-xs font-bold flex items-center gap-1 shadow-md shadow-[#FF1744]/20"
            >
              Seguimiento de Pedido
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
