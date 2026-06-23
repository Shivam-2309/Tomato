export interface User {
  _id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface AppContextType {
  user: User | null;
  loading: Boolean;
  isAuth: Boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  location: LocationData | null;
  loadingLocation: boolean;
  city: string;
  cart: ICart[] | null;
  fetchCart: () => Promise<void>;
  subTotal: number;
  quantity: number;
}

export interface IRestaurant {
  _id: string;
  name: string;
  description?: string;
  image: string;
  ownerId: string;
  phone: number;
  isVerified: boolean;
  likesCount: number;

  autoLocation: {
    // isme ek type h aur uska type h Point which is an Enum
    type: "Point";
    coordinates: [number, number];
    formattedAddress: string;
  };

  isOpen: boolean;
  createdAt: Date;
}

export interface IMenuItem extends Document {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICart {
  userId: string;
  restaurantId: string | IRestaurant;
  itemId: string | IMenuItem;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id: string;
  mobile: string;
  formattedAddress: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt: string;
}

export interface ILatLng {
  lat: number;
  lng: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  riderId?: string | null;
  riderPhone?: number | null;
  riderName?: string | null;
  distance: number;
  riderAmount?: number;

  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subTotal: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;

  addressId: string;
  deliveryAddress: {
    formattedAddress: string;
    mobile: number;
    latitude: number;
    longitude: number;
  };

  status:
    | "placed"
    | "accepted"
    | "preparing"
    | "ready_for_rider"
    | "rider_assigned"
    | "picked_up"
    | "delivered"
    | "cancelled";

  paymentMethod: "razorpay" | "stripe";
  paymentStatus: "pending" | "paid" | "failed";

  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIssue {
  _id: string;
  orderId: string;
  customerId: string;

  issueType:
    | "burnt_food"
    | "undercooked_food"
    | "missing_item"
    | "packaging_damage"
    | "other";

  description: string;
  imageUrl: string;

  status:
    | "AI_ANALYSIS_PENDING"
    | "ADMIN_REVIEW_PENDING"
    | "APPROVED"
    | "REJECTED";

  aiResult?: {
    issueDetected?: boolean;
    confidence?: number;
    severity?: "low" | "medium" | "high";
    reason?: string;
    recommendation?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface IRider {
  _id: string;
  userId: string;
  picture: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  isVerified: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  isAvailable: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
