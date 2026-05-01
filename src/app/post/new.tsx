import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  TextInput,
  Switch,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { 
  ChevronLeft, 
  Camera, 
  X, 
  MapPin, 
  Smartphone, 
  Car, 
  Home, 
  Shirt, 
  Lamp, 
  Trophy, 
  Package,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight
} from 'lucide-react-native';
import { create } from 'zustand';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/constants/theme';
import { Typography, Button, Input, Chip, Badge, PressableScale } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { uploadProductImages } from '@/services/firebase/storage.service';
import { createProduct } from '@/services/firebase/products.service';
import { useAuthStore } from '@/stores/authStore';
import { ProductCondition, Product } from '@/types/product.types';
import { CATEGORIES } from '@/constants/categories';
import { useToast } from '@/components/ui/Toast';

const { width } = Dimensions.get('window');

// Icon Helper
const CategoryIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  const icons: Record<string, any> = {
    Smartphone, Car, Home, Shirt, Lamp, Trophy, Package
  };
  const IconComp = icons[name] || Package;
  return <IconComp color={color} size={size} />;
};

// Local Store for the Form
interface PostState {
  step: number;
  images: string[];
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  condition: ProductCondition | null;
  price: number | null;
  originalPrice: number | null;
  negotiable: boolean;
  urgent: boolean;
  tags: string[];
  city: string;
  state: string;
  neighborhood: string;
  showNeighborhood: boolean;
  setField: <K extends keyof Omit<PostState, 'setField'>>(field: K, value: PostState[K]) => void;
  reset: () => void;
}

const usePostStore = create<PostState>((set) => ({
  step: 1,
  images: [],
  title: '',
  description: '',
  categoryId: '',
  subcategoryId: '',
  condition: null,
  price: null,
  originalPrice: null,
  negotiable: false,
  urgent: false,
  tags: [],
  city: '',
  state: '',
  neighborhood: '',
  showNeighborhood: true,
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  reset: () => set({
    step: 1, images: [], title: '', description: '', categoryId: '', subcategoryId: '',
    condition: null, price: null, originalPrice: null, negotiable: false, urgent: false,
    tags: [], city: '', state: '', neighborhood: '', showNeighborhood: true
  })
}));

export default function NewPostScreen() {
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const toast = useToast();
  const store = usePostStore();

  const [tagInput, setTagInput] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Input Refs (Moved to top level to fix Hook violations)
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const neighborhoodRef = useRef<TextInput>(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Animations
  const progressValue = useSharedValue(1);

  useEffect(() => {
    progressValue.value = withTiming(store.step, { duration: 400 });
  }, [store.step]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressValue.value, [1, 2, 3, 4], [25, 50, 75, 100], Extrapolation.CLAMP)}%`
  }));

  // Validations
  const canGoToStep2 = store.images.length > 0;
  const canGoToStep3 = store.categoryId !== '' && store.title.length >= 5 && store.condition !== null && store.description.length >= 10;
  const canGoToStep4 = store.price !== null && store.price > 0;
  const canSubmit = store.city !== '' && store.state !== '';

  const handleNext = () => {
    if (store.step < 4) store.setField('step', store.step + 1);
  };

  const handleBack = () => {
    if (store.step > 1) store.setField('step', store.step - 1);
    else router.back();
  };

  // Step 1: Images
  const handlePickImages = async () => {
    if (store.images.length >= 10) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Fixed deprecation
      allowsMultipleSelection: true,
      selectionLimit: 10 - store.images.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      store.setField('images', [...store.images, ...newUris].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...store.images];
    newImages.splice(index, 1);
    store.setField('images', newImages);
  };

  const swapImages = (index1: number, index2: number) => {
    const newImages = [...store.images];
    const temp = newImages[index1];
    newImages[index1] = newImages[index2];
    newImages[index2] = temp;
    store.setField('images', newImages);
  };

  // Step 2: Tags & Categories
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && store.tags.length < 10 && !store.tags.includes(trimmed)) {
      store.setField('tags', [...store.tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    store.setField('tags', store.tags.filter(t => t !== tag));
  };

  const selectedCategory = CATEGORIES.find(c => c.id === store.categoryId);

  // Step 3: Price Masking
  const handlePriceChange = (val: string, field: 'price' | 'originalPrice') => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) {
      store.setField(field, null);
      return;
    }
    const num = Number(numeric) / 100;
    store.setField(field, num);
  };

  const formatPriceInput = (val: number | null) => {
    if (val === null) return '';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Step 4: Location
  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permissão de localização negada');
      return;
    }
    try {
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (geocode[0]) {
        store.setField('city', geocode[0].city || geocode[0].subregion || '');
        store.setField('state', geocode[0].region || '');
        store.setField('neighborhood', geocode[0].district || '');
      }
    } catch (error) {
      toast.error('Erro ao buscar localização');
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    
    setIsUploading(true);
    try {
      const tempId = `prod_${Date.now()}`;
      const imageUrls = await uploadProductImages(store.images, tempId, (prog) => {
        setUploadProgress(prog);
      });

      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'favorites'> = {
        title: store.title,
        description: store.description,
        price: store.price!,
        originalPrice: store.originalPrice || undefined,
        condition: store.condition!,
        status: 'active',
        category: selectedCategory!,
        images: imageUrls,
        sellerId: user.id,
        sellerName: user.name,
        sellerAvatar: user.avatar,
        sellerRating: user.rating || 5.0,
        sellerVerified: user.verified,
        city: store.city,
        state: store.state,
        neighborhood: store.showNeighborhood ? store.neighborhood : undefined,
        negotiable: store.negotiable,
        boosted: store.urgent,
        tags: store.tags,
      };

      const newProduct = await createProduct(productData);
      
      toast.success('Anúncio publicado! 🎉');
      store.reset();
      router.replace(`/product/${newProduct.id}`);

    } catch (error) {
      toast.error('Erro ao publicar anúncio. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  // Step Content Components (To keep things clean and respect Hooks)
  const renderStep1 = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Typography variant="h2" style={{ marginBottom: spacing[2] }}>Adicione fotos</Typography>
      <Typography variant="body" color="textSecondary" style={{ marginBottom: spacing[6] }}>
        Fotos de boa qualidade ajudam a vender mais rápido. Adicione até 10 fotos.
      </Typography>

      <View style={styles.grid}>
        <TouchableOpacity 
          style={[styles.gridItem, styles.addPhotoBtn, { borderColor: colors.border, backgroundColor: colors.surfaceHover }]}
          onPress={handlePickImages}
        >
          <Camera color={colors.primary} size={32} />
          <Typography variant="caption" color="primary" style={{ marginTop: 4 }}>Adicionar</Typography>
        </TouchableOpacity>

        {store.images.map((uri, index) => (
          <View key={index} style={styles.gridItem}>
            <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} contentFit="cover" />
            
            <TouchableOpacity style={[styles.removePhotoBtn, { backgroundColor: colors.error, borderColor: colors.surface }]} onPress={() => removeImage(index)}>
              <X color={colors.surface} size={14} />
            </TouchableOpacity>

            {index === 0 && (
              <View style={[styles.coverBadge, { backgroundColor: colors.primary }]}>
                <Typography variant="caption" color="textInverse" weight="bold" style={{ fontSize: 10 }}>CAPA</Typography>
              </View>
            )}

            {index > 0 && (
              <TouchableOpacity style={styles.moveLeftBtn} onPress={() => swapImages(index, index - 1)}>
                <ChevronLeft color={colors.surface} size={14} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footerBar}>
        <Button label="Continuar" onPress={handleNext} disabled={!canGoToStep2} fullWidth />
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Typography variant="h2" style={{ marginBottom: spacing[6] }}>Detalhes do produto</Typography>
      
      <TouchableOpacity 
        style={[styles.selector, { borderColor: colors.border, borderRadius: radius.md }]} 
        onPress={() => setIsCategoryModalOpen(true)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.catIconCircle, { backgroundColor: selectedCategory ? selectedCategory.color + '20' : colors.surfaceHover }]}>
            {selectedCategory ? (
              <CategoryIcon name={selectedCategory.iconName} color={selectedCategory.color} size={20} />
            ) : (
              <Tag color={colors.textTertiary} size={20} />
            )}
          </View>
          <View>
            <Typography variant="caption" color="textSecondary">Categoria</Typography>
            <Typography variant="body" weight={selectedCategory ? 'semibold' : 'regular'} color={selectedCategory ? 'textPrimary' : 'textTertiary'}>
              {selectedCategory ? selectedCategory.name : 'Selecione uma categoria'}
            </Typography>
          </View>
        </View>
        <ChevronLeft color={colors.textSecondary} size={20} style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>

      <View style={{ height: spacing[4] }} />
      
      <Input
        label="Título do anúncio"
        placeholder="Ex: iPhone 13 Pro Max 256GB"
        value={store.title}
        onChangeText={(v) => store.setField('title', v)}
        maxLength={80}
      />
      
      <View style={{ height: spacing[6] }} />
      
      <Typography variant="bodySmall" weight="medium" color="textSecondary" style={{ marginBottom: spacing[2] }}>Condição</Typography>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['new', 'like-new', 'good', 'fair'] as ProductCondition[]).map(c => (
          <Chip 
            key={c} 
            label={c === 'new' ? 'Novo' : c === 'like-new' ? 'Seminovo' : c === 'good' ? 'Bom estado' : 'Usado'} 
            selected={store.condition === c} 
            onPress={() => store.setField('condition', c)} 
          />
        ))}
      </View>

      <View style={{ height: spacing[6] }} />

      <Input
        label="Descrição"
        placeholder="Descreva os detalhes, marcas de uso, o que acompanha..."
        value={store.description}
        onChangeText={(v) => store.setField('description', v)}
        multiline
        maxLength={4000}
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />

      <View style={{ height: spacing[6] }} />

      <Input
        label="Tags (palavras-chave)"
        placeholder="Digite e aperte Espaço ou Enter"
        value={tagInput}
        onChangeText={(v) => {
          if (v.endsWith(' ') || v.endsWith('\n')) {
            handleAddTag();
          } else {
            setTagInput(v);
          }
        }}
        onSubmitEditing={handleAddTag}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing[2] }}>
        {store.tags.map(t => (
          <Chip key={t} label={t} dismissible onDismiss={() => removeTag(t)} />
        ))}
      </View>

      <View style={styles.footerBar}>
        <Button label="Continuar" onPress={handleNext} disabled={!canGoToStep3} fullWidth />
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Typography variant="h2" style={{ marginBottom: spacing[6] }}>Preço</Typography>

      <Input
        label="Preço de venda"
        placeholder="R$ 0,00"
        keyboardType="numeric"
        value={formatPriceInput(store.price)}
        onChangeText={(v) => handlePriceChange(v, 'price')}
        style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}
      />

      <View style={{ height: spacing[6] }} />

      <View style={[styles.switchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Typography variant="body" weight="semibold">Aceito negociação</Typography>
            <Typography variant="caption" color="textSecondary">Compradores podem enviar ofertas pelo chat</Typography>
          </View>
          <Switch 
            value={store.negotiable} 
            onValueChange={(v) => store.setField('negotiable', v)} 
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={store.negotiable ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>

      <View style={[styles.switchCard, { backgroundColor: colors.surface, borderColor: colors.error + '20', marginTop: spacing[4] }]}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Typography variant="body" weight="semibold" color="error">Venda urgente (Destaque)</Typography>
            <Typography variant="caption" color="textSecondary">Seu anúncio terá um selo especial e maior visibilidade</Typography>
          </View>
          <Switch 
            value={store.urgent} 
            onValueChange={(v) => store.setField('urgent', v)} 
            trackColor={{ false: colors.border, true: colors.errorLight }}
            thumbColor={store.urgent ? colors.error : colors.textTertiary}
          />
        </View>
      </View>

      {store.urgent && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginTop: spacing[6] }}>
          <Input
            label="Preço original (opcional)"
            placeholder="R$ 0,00"
            keyboardType="numeric"
            value={formatPriceInput(store.originalPrice)}
            onChangeText={(v) => handlePriceChange(v, 'originalPrice')}
            hint="Mostra um preço riscado ao lado do valor atual para atrair mais atenção"
          />
        </Animated.View>
      )}

      <View style={styles.footerBar}>
        <Button label="Continuar" onPress={handleNext} disabled={!canGoToStep4} fullWidth />
      </View>
    </Animated.View>
  );

  const renderStep4 = () => {
    // Mock preview product
    const previewProduct = {
      id: 'preview',
      title: store.title || 'Título do produto',
      price: store.price || 0,
      originalPrice: store.originalPrice || undefined,
      condition: store.condition || 'new',
      images: store.images,
      city: store.city || 'Cidade',
      createdAt: new Date(),
      boosted: store.urgent
    };

    return (
      <Animated.View entering={FadeIn} style={styles.stepContainer}>
        <Typography variant="h2" style={{ marginBottom: spacing[6] }}>Localização e Publicação</Typography>

        <Button 
          variant="outline" 
          label="Usar minha localização atual" 
          leftIcon={<MapPin color={colors.primary} size={18} />} 
          onPress={handleGetLocation} 
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing[6] }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Typography variant="caption" color="textTertiary" style={{ marginHorizontal: 12 }}>OU INFORME MANUALMENTE</Typography>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>
        
        <View style={{ flexDirection: 'row', gap: spacing[4] }}>
          <View style={{ flex: 2 }}>
            <Input 
              label="Cidade" 
              placeholder="Ex: São Paulo" 
              value={store.city} 
              onChangeText={(v) => store.setField('city', v)} 
              ref={cityRef}
              returnKeyType="next"
              onSubmitEditing={() => stateRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input 
              label="UF" 
              placeholder="SP" 
              value={store.state} 
              onChangeText={(v) => store.setField('state', v)} 
              maxLength={2} 
              autoCapitalize="characters"
              ref={stateRef}
              returnKeyType="next"
              onSubmitEditing={() => neighborhoodRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </View>
        <View style={{ height: spacing[4] }} />
        <Input 
          label="Bairro (Opcional)" 
          placeholder="Ex: Pinheiros" 
          value={store.neighborhood} 
          onChangeText={(v) => store.setField('neighborhood', v)} 
          ref={neighborhoodRef}
          returnKeyType="done"
        />

        <View style={[styles.switchRow, { marginTop: spacing[6], marginBottom: spacing[8] }]}>
          <Typography variant="body" weight="semibold">Exibir bairro no anúncio</Typography>
          <Switch 
            value={store.showNeighborhood} 
            onValueChange={(v) => store.setField('showNeighborhood', v)} 
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={store.showNeighborhood ? colors.primary : colors.textTertiary}
          />
        </View>

        <View style={[styles.previewSection, { backgroundColor: colors.surfaceHover, borderRadius: radius.lg }]}>
          <Typography variant="h3" style={{ marginBottom: spacing[4], paddingHorizontal: 16, paddingTop: 16 }}>Preview</Typography>
          <View style={{ alignSelf: 'center', marginBottom: 16 }}>
            <ProductCard product={previewProduct as any} index={0} />
          </View>
        </View>

        <View style={styles.footerBar}>
          <Button 
            label="Publicar anúncio" 
            onPress={handleSubmit} 
            disabled={!canSubmit} 
            fullWidth 
            rightIcon={<ArrowRight color="#FFF" size={20} />}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="auto" />
      
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <PressableScale onPress={handleBack} style={{ padding: 4 }}>
            <ChevronLeft color={colors.textPrimary} size={28} />
          </PressableScale>
          <Typography variant="h3" style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>
            Novo Anúncio
          </Typography>
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: colors.primaryLight }]}>
          <Animated.View style={[styles.progressBarFill, { backgroundColor: colors.primary }, animatedProgressStyle]} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {store.step === 1 && renderStep1()}
          {store.step === 2 && renderStep2()}
          {store.step === 3 && renderStep3()}
          {store.step === 4 && renderStep4()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal visible={isCategoryModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.headerTop, { padding: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Typography variant="h2" style={{ flex: 1 }}>Selecione uma categoria</Typography>
            <TouchableOpacity onPress={() => setIsCategoryModalOpen(false)}>
              <X color={colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing[4], flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.modalCategoryCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
                onPress={() => {
                  store.setField('categoryId', cat.id);
                  setIsCategoryModalOpen(false);
                }}
              >
                <View style={[styles.catIconLarge, { backgroundColor: cat.color + '15' }]}>
                  <CategoryIcon name={cat.iconName} color={cat.color} size={32} />
                </View>
                <Typography variant="body" weight="semibold" align="center">{cat.name}</Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Uploading Modal */}
      {isUploading && (
        <View style={styles.uploadModal}>
          <View style={[styles.uploadCard, { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.lg }]}>
            <Typography variant="h3" align="center" style={{ marginBottom: spacing[4] }}>Publicando...</Typography>
            <View style={[styles.progressBarContainer, { backgroundColor: colors.primaryLight, marginBottom: spacing[2], height: 8, marginHorizontal: 0 }]}>
              <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${uploadProgress * 100}%` }]} />
            </View>
            <Typography variant="caption" color="textSecondary" align="center">
              Enviando fotos e finalizando anúncio ({Math.round(uploadProgress * 100)}%)
            </Typography>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBarContainer: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: (width - 40 - 16) / 3, 
    height: (width - 40 - 16) / 3,
    position: 'relative',
  },
  addPhotoBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2,
  },
  moveLeftBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footerBar: {
    marginTop: 32,
    marginBottom: 20,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    padding: 14,
  },
  catIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCategoryCard: {
    width: (width - 32 - 16) / 2,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  previewSection: {
    paddingBottom: 16,
    marginTop: 16,
  },
  uploadModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadCard: {
    width: '85%',
    padding: 24,
  }
});
