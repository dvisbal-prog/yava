
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "addresses": {
                  Row: {
                    "city_id": string | null,"created_at": string,"id": string,"instructions": string | null,"is_default": boolean,"label": string,"lat": number | null,"line1": string,"line2": string | null,"lng": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city_id"?: string | null,"created_at"?: string,"id"?: string,"instructions"?: string | null,"is_default"?: boolean,"label"?: string,"lat"?: number | null,"line1": string,"line2"?: string | null,"lng"?: number | null,"user_id": string
                  }
                  Update: {
                    "city_id"?: string | null,"created_at"?: string,"id"?: string,"instructions"?: string | null,"is_default"?: boolean,"label"?: string,"lat"?: number | null,"line1"?: string,"line2"?: string | null,"lng"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "addresses_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "addresses_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "addresses_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"admin_invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"role": Database["public"]['Enums']["admin_role"],"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role": Database["public"]['Enums']["admin_role"],"token"?: string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["admin_role"],"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"admin_users": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"invited_at": string | null,"invited_by": string | null,"role": Database["public"]['Enums']["admin_role"],"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"invited_at"?: string | null,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["admin_role"],"status"?: string,"user_id": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"invited_at"?: string | null,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["admin_role"],"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_users_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_users_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"after": Json | null,"before": Json | null,"created_at": string,"entity": string,"entity_id": string | null,"id": number,"reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"after"?: Json | null,"before"?: Json | null,"created_at"?: string,"entity": string,"entity_id"?: string | null,"id"?: never,"reason"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"after"?: Json | null,"before"?: Json | null,"created_at"?: string,"entity"?: string,"entity_id"?: string | null,"id"?: never,"reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "active": boolean,"center_lat": number | null,"center_lng": number | null,"created_at": string,"department": string | null,"id": string,"name": string,"slug": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"center_lat"?: number | null,"center_lng"?: number | null,"created_at"?: string,"department"?: string | null,"id"?: string,"name": string,"slug": string,"timezone"?: string
                  }
                  Update: {
                    "active"?: boolean,"center_lat"?: number | null,"center_lng"?: number | null,"created_at"?: string,"department"?: string | null,"id"?: string,"name"?: string,"slug"?: string,"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"coupon_redemptions": {
                  Row: {
                    "coupon_id": string,"created_at": string,"order_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "coupon_id": string,"created_at"?: string,"order_id": string,"user_id": string
                  }
                  Update: {
                    "coupon_id"?: string,"created_at"?: string,"order_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coupon_redemptions_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_redemptions_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_redemptions_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_redemptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"coupons": {
                  Row: {
                    "active": boolean,"code": string,"created_at": string,"description": string | null,"funded_by": string,"id": string,"max_uses": number | null,"merchant_id": string | null,"min_order": number,"per_user_limit": number,"type": Database["public"]['Enums']["coupon_type"],"uses": number,"valid_from": string | null,"valid_to": string | null,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"created_at"?: string,"description"?: string | null,"funded_by"?: string,"id"?: string,"max_uses"?: number | null,"merchant_id"?: string | null,"min_order"?: number,"per_user_limit"?: number,"type": Database["public"]['Enums']["coupon_type"],"uses"?: number,"valid_from"?: string | null,"valid_to"?: string | null,"value"?: number
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"created_at"?: string,"description"?: string | null,"funded_by"?: string,"id"?: string,"max_uses"?: number | null,"merchant_id"?: string | null,"min_order"?: number,"per_user_limit"?: number,"type"?: Database["public"]['Enums']["coupon_type"],"uses"?: number,"valid_from"?: string | null,"valid_to"?: string | null,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "coupons_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupons_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    }
                  ]
                },"courier_documents": {
                  Row: {
                    "courier_id": string,"created_at": string,"doc_type": string,"file_path": string,"id": string,"notes": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["document_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "courier_id": string,"created_at"?: string,"doc_type": string,"file_path": string,"id"?: string,"notes"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["document_status"]
                  }
                  Update: {
                    "courier_id"?: string,"created_at"?: string,"doc_type"?: string,"file_path"?: string,"id"?: string,"notes"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["document_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "courier_documents_courier_id_fkey"
      columns: ["courier_id"]
isOneToOne: false
      referencedRelation: "couriers"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "courier_documents_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"courier_location_history": {
                  Row: {
                    "courier_id": string,"id": number,"lat": number,"lng": number,"order_id": string | null,"recorded_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "courier_id": string,"id"?: never,"lat": number,"lng": number,"order_id"?: string | null,"recorded_at"?: string
                  }
                  Update: {
                    "courier_id"?: string,"id"?: never,"lat"?: number,"lng"?: number,"order_id"?: string | null,"recorded_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "courier_location_history_courier_id_fkey"
      columns: ["courier_id"]
isOneToOne: false
      referencedRelation: "couriers"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "courier_location_history_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courier_location_history_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"courier_withdrawals": {
                  Row: {
                    "amount": number,"bank_snapshot": Json | null,"courier_id": string,"created_at": string,"id": string,"processed_at": string | null,"processed_by": string | null,"reference": string | null,"status": Database["public"]['Enums']["settlement_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"bank_snapshot"?: Json | null,"courier_id": string,"created_at"?: string,"id"?: string,"processed_at"?: string | null,"processed_by"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["settlement_status"]
                  }
                  Update: {
                    "amount"?: number,"bank_snapshot"?: Json | null,"courier_id"?: string,"created_at"?: string,"id"?: string,"processed_at"?: string | null,"processed_by"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["settlement_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "courier_withdrawals_courier_id_fkey"
      columns: ["courier_id"]
isOneToOne: false
      referencedRelation: "couriers"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "courier_withdrawals_processed_by_fkey"
      columns: ["processed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"couriers": {
                  Row: {
                    "balance": number,"bank_account": Json | null,"city_id": string | null,"created_at": string,"current_lat": number | null,"current_lng": number | null,"deliveries_count": number,"document_number": string | null,"is_online": boolean,"last_seen_at": string | null,"plate": string | null,"rating_avg": number,"rating_count": number,"review_notes": string | null,"status": Database["public"]['Enums']["courier_status"],"updated_at": string,"user_id": string,"vehicle": Database["public"]['Enums']["vehicle_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "balance"?: number,"bank_account"?: Json | null,"city_id"?: string | null,"created_at"?: string,"current_lat"?: number | null,"current_lng"?: number | null,"deliveries_count"?: number,"document_number"?: string | null,"is_online"?: boolean,"last_seen_at"?: string | null,"plate"?: string | null,"rating_avg"?: number,"rating_count"?: number,"review_notes"?: string | null,"status"?: Database["public"]['Enums']["courier_status"],"updated_at"?: string,"user_id": string,"vehicle"?: Database["public"]['Enums']["vehicle_type"]
                  }
                  Update: {
                    "balance"?: number,"bank_account"?: Json | null,"city_id"?: string | null,"created_at"?: string,"current_lat"?: number | null,"current_lng"?: number | null,"deliveries_count"?: number,"document_number"?: string | null,"is_online"?: boolean,"last_seen_at"?: string | null,"plate"?: string | null,"rating_avg"?: number,"rating_count"?: number,"review_notes"?: string | null,"status"?: Database["public"]['Enums']["courier_status"],"updated_at"?: string,"user_id"?: string,"vehicle"?: Database["public"]['Enums']["vehicle_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "couriers_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "couriers_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "couriers_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"delivery_zones": {
                  Row: {
                    "active": boolean,"base_delivery_fee": number,"center_lat": number,"center_lng": number,"city_id": string,"id": string,"name": string,"radius_km": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"base_delivery_fee"?: number,"center_lat": number,"center_lng": number,"city_id": string,"id"?: string,"name": string,"radius_km"?: number
                  }
                  Update: {
                    "active"?: boolean,"base_delivery_fee"?: number,"center_lat"?: number,"center_lng"?: number,"city_id"?: string,"id"?: string,"name"?: string,"radius_km"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "delivery_zones_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_zones_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    }
                  ]
                },"device_tokens": {
                  Row: {
                    "created_at": string,"id": string,"platform": string,"token": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"platform": string,"token": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"platform"?: string,"token"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "device_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"merchant_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"merchant_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"merchant_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"merchant_documents": {
                  Row: {
                    "created_at": string,"doc_type": string,"file_path": string,"id": string,"merchant_id": string,"notes": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["document_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"doc_type": string,"file_path": string,"id"?: string,"merchant_id": string,"notes"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["document_status"]
                  }
                  Update: {
                    "created_at"?: string,"doc_type"?: string,"file_path"?: string,"id"?: string,"merchant_id"?: string,"notes"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["document_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "merchant_documents_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "merchant_documents_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "merchant_documents_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"merchant_hours": {
                  Row: {
                    "closes": string,"id": string,"merchant_id": string,"opens": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "closes": string,"id"?: string,"merchant_id": string,"opens": string,"weekday": number
                  }
                  Update: {
                    "closes"?: string,"id"?: string,"merchant_id"?: string,"opens"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "merchant_hours_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "merchant_hours_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    }
                  ]
                },"merchant_members": {
                  Row: {
                    "member_role": string,"merchant_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "member_role"?: string,"merchant_id": string,"user_id": string
                  }
                  Update: {
                    "member_role"?: string,"merchant_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "merchant_members_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "merchant_members_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "merchant_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"merchants": {
                  Row: {
                    "accepts_orders": boolean,"address": string | null,"bank_account": Json | null,"category": Database["public"]['Enums']["merchant_category"],"city_id": string | null,"commission_rate": number,"cover_url": string | null,"created_at": string,"delivery_fee": number,"description": string | null,"featured": boolean,"id": string,"lat": number | null,"legal_name": string | null,"lng": number | null,"logo_url": string | null,"manual_closed": boolean,"min_order": number,"name": string,"owner_id": string | null,"phone": string | null,"prep_max": number,"prep_min": number,"rating_avg": number,"rating_count": number,"review_notes": string | null,"slug": string,"status": Database["public"]['Enums']["merchant_status"],"tagline": string | null,"tags": (string)[],"tax_id": string | null,"updated_at": string,"merchant_is_open": boolean | null
                  }
                  ComputedFields: "merchant_is_open"
                  Insert: {
                    "accepts_orders"?: boolean,"address"?: string | null,"bank_account"?: Json | null,"category"?: Database["public"]['Enums']["merchant_category"],"city_id"?: string | null,"commission_rate"?: number,"cover_url"?: string | null,"created_at"?: string,"delivery_fee"?: number,"description"?: string | null,"featured"?: boolean,"id"?: string,"lat"?: number | null,"legal_name"?: string | null,"lng"?: number | null,"logo_url"?: string | null,"manual_closed"?: boolean,"min_order"?: number,"name": string,"owner_id"?: string | null,"phone"?: string | null,"prep_max"?: number,"prep_min"?: number,"rating_avg"?: number,"rating_count"?: number,"review_notes"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["merchant_status"],"tagline"?: string | null,"tags"?: (string)[],"tax_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "accepts_orders"?: boolean,"address"?: string | null,"bank_account"?: Json | null,"category"?: Database["public"]['Enums']["merchant_category"],"city_id"?: string | null,"commission_rate"?: number,"cover_url"?: string | null,"created_at"?: string,"delivery_fee"?: number,"description"?: string | null,"featured"?: boolean,"id"?: string,"lat"?: number | null,"legal_name"?: string | null,"lng"?: number | null,"logo_url"?: string | null,"manual_closed"?: boolean,"min_order"?: number,"name"?: string,"owner_id"?: string | null,"phone"?: string | null,"prep_max"?: number,"prep_min"?: number,"rating_avg"?: number,"rating_count"?: number,"review_notes"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["merchant_status"],"tagline"?: string | null,"tags"?: (string)[],"tax_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "merchants_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "merchants_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "merchants_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"data": NonNullable<Json>,"id": number,"read_at": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: never,"read_at"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: never,"read_at"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"operating_expenses": {
                  Row: {
                    "amount": number,"category": string,"city_id": string | null,"created_at": string,"created_by": string | null,"date": string,"description": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"category": string,"city_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"date": string,"description"?: string | null,"id"?: string
                  }
                  Update: {
                    "amount"?: number,"category"?: string,"city_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"date"?: string,"description"?: string | null,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "operating_expenses_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "operating_expenses_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "operating_expenses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"order_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"id": number,"note": string | null,"order_id": string,"status": Database["public"]['Enums']["order_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"order_id": string,"status": Database["public"]['Enums']["order_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"order_id"?: string,"status"?: Database["public"]['Enums']["order_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "id": string,"name": string,"notes": string | null,"options": NonNullable<Json>,"order_id": string,"product_id": string | null,"qty": number,"total": number,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"notes"?: string | null,"options"?: NonNullable<Json>,"order_id": string,"product_id"?: string | null,"qty": number,"total": number,"unit_price": number
                  }
                  Update: {
                    "id"?: string,"name"?: string,"notes"?: string | null,"options"?: NonNullable<Json>,"order_id"?: string,"product_id"?: string | null,"qty"?: number,"total"?: number,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"order_messages": {
                  Row: {
                    "body": string,"created_at": string,"id": number,"order_id": string,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: never,"order_id": string,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: never,"order_id"?: string,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_messages_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_messages_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "accepted_at": string | null,"address_snapshot": NonNullable<Json>,"assigned_at": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"city_id": string | null,"commission_amount": number,"commission_rate": number,"coupon_id": string | null,"courier_id": string | null,"courier_payout": number,"created_at": string,"customer_id": string,"delivered_at": string | null,"delivery_code": string,"delivery_fee": number,"delivery_lat": number | null,"delivery_lng": number | null,"discount": number,"eta_max": number | null,"eta_min": number | null,"gateway_fee": number,"id": string,"items_subtotal": number,"merchant_id": string | null,"merchant_payout": number,"notes": string | null,"number": number,"package_details": Json | null,"payment_method": Database["public"]['Enums']["payment_method"],"payment_method_id": string | null,"payment_status": Database["public"]['Enums']["payment_status"],"picked_up_at": string | null,"pickup_snapshot": Json | null,"placed_at": string,"ready_at": string | null,"service_fee": number,"status": Database["public"]['Enums']["order_status"],"total": number,"type": Database["public"]['Enums']["order_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"address_snapshot"?: NonNullable<Json>,"assigned_at"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"city_id"?: string | null,"commission_amount"?: number,"commission_rate"?: number,"coupon_id"?: string | null,"courier_id"?: string | null,"courier_payout"?: number,"created_at"?: string,"customer_id": string,"delivered_at"?: string | null,"delivery_code"?: string,"delivery_fee"?: number,"delivery_lat"?: number | null,"delivery_lng"?: number | null,"discount"?: number,"eta_max"?: number | null,"eta_min"?: number | null,"gateway_fee"?: number,"id"?: string,"items_subtotal"?: number,"merchant_id"?: string | null,"merchant_payout"?: number,"notes"?: string | null,"number"?: number,"package_details"?: Json | null,"payment_method"?: Database["public"]['Enums']["payment_method"],"payment_method_id"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"picked_up_at"?: string | null,"pickup_snapshot"?: Json | null,"placed_at"?: string,"ready_at"?: string | null,"service_fee"?: number,"status"?: Database["public"]['Enums']["order_status"],"total"?: number,"type"?: Database["public"]['Enums']["order_type"],"updated_at"?: string
                  }
                  Update: {
                    "accepted_at"?: string | null,"address_snapshot"?: NonNullable<Json>,"assigned_at"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"city_id"?: string | null,"commission_amount"?: number,"commission_rate"?: number,"coupon_id"?: string | null,"courier_id"?: string | null,"courier_payout"?: number,"created_at"?: string,"customer_id"?: string,"delivered_at"?: string | null,"delivery_code"?: string,"delivery_fee"?: number,"delivery_lat"?: number | null,"delivery_lng"?: number | null,"discount"?: number,"eta_max"?: number | null,"eta_min"?: number | null,"gateway_fee"?: number,"id"?: string,"items_subtotal"?: number,"merchant_id"?: string | null,"merchant_payout"?: number,"notes"?: string | null,"number"?: number,"package_details"?: Json | null,"payment_method"?: Database["public"]['Enums']["payment_method"],"payment_method_id"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"picked_up_at"?: string | null,"pickup_snapshot"?: Json | null,"placed_at"?: string,"ready_at"?: string | null,"service_fee"?: number,"status"?: Database["public"]['Enums']["order_status"],"total"?: number,"type"?: Database["public"]['Enums']["order_type"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "orders_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_courier_id_fkey"
      columns: ["courier_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_payment_method_id_fkey"
      columns: ["payment_method_id"]
isOneToOne: false
      referencedRelation: "payment_methods"
      referencedColumns: ["id"]
    }
                  ]
                },"owner_alerts": {
                  Row: {
                    "acknowledged_at": string | null,"acknowledged_by": string | null,"body": string | null,"created_at": string,"entity": string | null,"entity_id": string | null,"id": number,"severity": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acknowledged_at"?: string | null,"acknowledged_by"?: string | null,"body"?: string | null,"created_at"?: string,"entity"?: string | null,"entity_id"?: string | null,"id"?: never,"severity"?: string,"title": string
                  }
                  Update: {
                    "acknowledged_at"?: string | null,"acknowledged_by"?: string | null,"body"?: string | null,"created_at"?: string,"entity"?: string | null,"entity_id"?: string | null,"id"?: never,"severity"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "owner_alerts_acknowledged_by_fkey"
      columns: ["acknowledged_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_methods": {
                  Row: {
                    "brand": string | null,"created_at": string,"exp_month": number | null,"exp_year": number | null,"holder_name": string | null,"id": string,"is_default": boolean,"last4": string | null,"method": Database["public"]['Enums']["payment_method"],"provider": string,"provider_token": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string | null,"created_at"?: string,"exp_month"?: number | null,"exp_year"?: number | null,"holder_name"?: string | null,"id"?: string,"is_default"?: boolean,"last4"?: string | null,"method"?: Database["public"]['Enums']["payment_method"],"provider"?: string,"provider_token"?: string | null,"user_id": string
                  }
                  Update: {
                    "brand"?: string | null,"created_at"?: string,"exp_month"?: number | null,"exp_year"?: number | null,"holder_name"?: string | null,"id"?: string,"is_default"?: boolean,"last4"?: string | null,"method"?: Database["public"]['Enums']["payment_method"],"provider"?: string,"provider_token"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_methods_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string,"currency": string,"gateway_fee": number,"id": string,"order_id": string,"provider": string,"provider_ref": string | null,"raw": Json | null,"status": Database["public"]['Enums']["payment_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"currency"?: string,"gateway_fee"?: number,"id"?: string,"order_id": string,"provider"?: string,"provider_ref"?: string | null,"raw"?: Json | null,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"currency"?: string,"gateway_fee"?: number,"id"?: string,"order_id"?: string,"provider"?: string,"provider_ref"?: string | null,"raw"?: Json | null,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "description": string | null,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "platform_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"product_categories": {
                  Row: {
                    "id": string,"merchant_id": string,"name": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"merchant_id": string,"name": string,"sort"?: number
                  }
                  Update: {
                    "id"?: string,"merchant_id"?: string,"name"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_categories_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_categories_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    }
                  ]
                },"product_option_groups": {
                  Row: {
                    "id": string,"max_select": number,"min_select": number,"name": string,"product_id": string,"required": boolean,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"max_select"?: number,"min_select"?: number,"name": string,"product_id": string,"required"?: boolean,"sort"?: number
                  }
                  Update: {
                    "id"?: string,"max_select"?: number,"min_select"?: number,"name"?: string,"product_id"?: string,"required"?: boolean,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_option_groups_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_options": {
                  Row: {
                    "available": boolean,"group_id": string,"id": string,"name": string,"price_delta": number,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "available"?: boolean,"group_id": string,"id"?: string,"name": string,"price_delta"?: number,"sort"?: number
                  }
                  Update: {
                    "available"?: boolean,"group_id"?: string,"id"?: string,"name"?: string,"price_delta"?: number,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_options_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "product_option_groups"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "available_from": string | null,"available_to": string | null,"category_id": string | null,"created_at": string,"description": string | null,"id": string,"image_urls": (string)[],"merchant_id": string,"name": string,"price": number,"sort": number,"status": Database["public"]['Enums']["product_status"],"stock": number | null,"track_stock": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "available_from"?: string | null,"available_to"?: string | null,"category_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"image_urls"?: (string)[],"merchant_id": string,"name": string,"price": number,"sort"?: number,"status"?: Database["public"]['Enums']["product_status"],"stock"?: number | null,"track_stock"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "available_from"?: string | null,"available_to"?: string | null,"category_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"image_urls"?: (string)[],"merchant_id"?: string,"name"?: string,"price"?: number,"sort"?: number,"status"?: Database["public"]['Enums']["product_status"],"stock"?: number | null,"track_stock"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "product_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"city_id": string | null,"created_at": string,"email": string | null,"full_name": string | null,"id": string,"notifications_enabled": boolean,"phone": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"city_id"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id": string,"notifications_enabled"?: boolean,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"city_id"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"notifications_enabled"?: boolean,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    }
                  ]
                },"promotions": {
                  Row: {
                    "active": boolean,"city_id": string | null,"coupon_code": string | null,"ends_at": string | null,"id": string,"image_url": string | null,"merchant_id": string | null,"sort": number,"starts_at": string | null,"subtitle": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"city_id"?: string | null,"coupon_code"?: string | null,"ends_at"?: string | null,"id"?: string,"image_url"?: string | null,"merchant_id"?: string | null,"sort"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title": string
                  }
                  Update: {
                    "active"?: boolean,"city_id"?: string | null,"coupon_code"?: string | null,"ends_at"?: string | null,"id"?: string,"image_url"?: string | null,"merchant_id"?: string | null,"sort"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "promotions_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "promotions_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "promotions_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "promotions_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    }
                  ]
                },"ratings": {
                  Row: {
                    "comment": string | null,"courier_id": string | null,"courier_rating": number | null,"created_at": string,"customer_id": string,"id": string,"merchant_id": string | null,"merchant_rating": number | null,"order_id": string,"tags": (string)[],"tip": number
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"courier_id"?: string | null,"courier_rating"?: number | null,"created_at"?: string,"customer_id": string,"id"?: string,"merchant_id"?: string | null,"merchant_rating"?: number | null,"order_id": string,"tags"?: (string)[],"tip"?: number
                  }
                  Update: {
                    "comment"?: string | null,"courier_id"?: string | null,"courier_rating"?: number | null,"created_at"?: string,"customer_id"?: string,"id"?: string,"merchant_id"?: string | null,"merchant_rating"?: number | null,"order_id"?: string,"tags"?: (string)[],"tip"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "ratings_courier_id_fkey"
      columns: ["courier_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_order_id_fkey"
      columns: ["order_id"]
isOneToOne: true
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_order_id_fkey"
      columns: ["order_id"]
isOneToOne: true
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"settlement_orders": {
                  Row: {
                    "amount": number,"order_id": string,"settlement_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"order_id": string,"settlement_id": string
                  }
                  Update: {
                    "amount"?: number,"order_id"?: string,"settlement_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "settlement_orders_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "settlement_orders_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "settlement_orders_settlement_id_fkey"
      columns: ["settlement_id"]
isOneToOne: false
      referencedRelation: "settlements"
      referencedColumns: ["id"]
    }
                  ]
                },"settlements": {
                  Row: {
                    "adjustments": number,"approval_reason": string | null,"approved_at": string | null,"approved_by": string | null,"bank_snapshot": Json | null,"commissions": number,"created_at": string,"gross": number,"id": string,"net": number,"notes": string | null,"orders_count": number,"paid_at": string | null,"paid_by": string | null,"payee_id": string,"payee_type": Database["public"]['Enums']["payee_type"],"payment_reference": string | null,"period_end": string,"period_start": string,"status": Database["public"]['Enums']["settlement_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "adjustments"?: number,"approval_reason"?: string | null,"approved_at"?: string | null,"approved_by"?: string | null,"bank_snapshot"?: Json | null,"commissions"?: number,"created_at"?: string,"gross"?: number,"id"?: string,"net"?: number,"notes"?: string | null,"orders_count"?: number,"paid_at"?: string | null,"paid_by"?: string | null,"payee_id": string,"payee_type": Database["public"]['Enums']["payee_type"],"payment_reference"?: string | null,"period_end": string,"period_start": string,"status"?: Database["public"]['Enums']["settlement_status"],"updated_at"?: string
                  }
                  Update: {
                    "adjustments"?: number,"approval_reason"?: string | null,"approved_at"?: string | null,"approved_by"?: string | null,"bank_snapshot"?: Json | null,"commissions"?: number,"created_at"?: string,"gross"?: number,"id"?: string,"net"?: number,"notes"?: string | null,"orders_count"?: number,"paid_at"?: string | null,"paid_by"?: string | null,"payee_id"?: string,"payee_type"?: Database["public"]['Enums']["payee_type"],"payment_reference"?: string | null,"period_end"?: string,"period_start"?: string,"status"?: Database["public"]['Enums']["settlement_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "settlements_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "settlements_paid_by_fkey"
      columns: ["paid_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"support_cases": {
                  Row: {
                    "assigned_to": string | null,"category": string,"created_at": string,"description": string | null,"id": string,"number": number,"opened_by": string,"opener_role": Database["public"]['Enums']["app_role"],"order_id": string | null,"priority": string,"resolution": string | null,"resolved_at": string | null,"status": Database["public"]['Enums']["support_status"],"subject": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"category"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"number"?: never,"opened_by": string,"opener_role"?: Database["public"]['Enums']["app_role"],"order_id"?: string | null,"priority"?: string,"resolution"?: string | null,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["support_status"],"subject": string,"updated_at"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"category"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"number"?: never,"opened_by"?: string,"opener_role"?: Database["public"]['Enums']["app_role"],"order_id"?: string | null,"priority"?: string,"resolution"?: string | null,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["support_status"],"subject"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "support_cases_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "support_cases_opened_by_fkey"
      columns: ["opened_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "support_cases_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "order_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "support_cases_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"support_messages": {
                  Row: {
                    "body": string,"case_id": string,"created_at": string,"id": number,"internal": boolean,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"case_id": string,"created_at"?: string,"id"?: never,"internal"?: boolean,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"case_id"?: string,"created_at"?: string,"id"?: never,"internal"?: boolean,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "support_messages_case_id_fkey"
      columns: ["case_id"]
isOneToOne: false
      referencedRelation: "support_cases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "support_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "city_summary": {
                  Row: {
                    "active_merchants": number | null,"active_orders": number | null,"city_id": string | null,"city_name": string | null,"delivered_orders": number | null,"merchant_sales": number | null,"online_couriers": number | null,"yava_revenue": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"daily_finance": {
                  Row: {
                    "city_id": string | null,"collected": number | null,"commissions": number | null,"courier_payouts": number | null,"day": string | null,"delivered_orders": number | null,"delivery_fees": number | null,"discounts": number | null,"gateway_fees": number | null,"merchant_payouts": number | null,"merchant_sales": number | null,"service_fees": number | null,"type": Database["public"]['Enums']["order_type"] | null,"yava_contribution": number | null,"yava_gross_revenue": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "orders_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    }
                  ]
                },"merchant_public": {
                  Row: {
                    "accepts_orders": boolean | null,"address": string | null,"bank_account": Json | null,"category": Database["public"]['Enums']["merchant_category"] | null,"city_id": string | null,"commission_rate": number | null,"cover_url": string | null,"created_at": string | null,"delivery_fee": number | null,"description": string | null,"featured": boolean | null,"id": string | null,"is_open": boolean | null,"lat": number | null,"legal_name": string | null,"lng": number | null,"logo_url": string | null,"manual_closed": boolean | null,"min_order": number | null,"name": string | null,"owner_id": string | null,"phone": string | null,"prep_max": number | null,"prep_min": number | null,"rating_avg": number | null,"rating_count": number | null,"review_notes": string | null,"slug": string | null,"status": Database["public"]['Enums']["merchant_status"] | null,"tagline": string | null,"tags": (string)[] | null,"tax_id": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "accepts_orders"?: boolean | null,"address"?: string | null,"bank_account"?: Json | null,"category"?: Database["public"]['Enums']["merchant_category"] | null,"city_id"?: string | null,"commission_rate"?: number | null,"cover_url"?: string | null,"created_at"?: string | null,"delivery_fee"?: number | null,"description"?: string | null,"featured"?: boolean | null,"id"?: string | null,"is_open"?: never,"lat"?: number | null,"legal_name"?: string | null,"lng"?: number | null,"logo_url"?: string | null,"manual_closed"?: boolean | null,"min_order"?: number | null,"name"?: string | null,"owner_id"?: string | null,"phone"?: string | null,"prep_max"?: number | null,"prep_min"?: number | null,"rating_avg"?: number | null,"rating_count"?: number | null,"review_notes"?: string | null,"slug"?: string | null,"status"?: Database["public"]['Enums']["merchant_status"] | null,"tagline"?: string | null,"tags"?: (string)[] | null,"tax_id"?: string | null,"updated_at"?: string | null
                         }
                        Update: {
                           "accepts_orders"?: boolean | null,"address"?: string | null,"bank_account"?: Json | null,"category"?: Database["public"]['Enums']["merchant_category"] | null,"city_id"?: string | null,"commission_rate"?: number | null,"cover_url"?: string | null,"created_at"?: string | null,"delivery_fee"?: number | null,"description"?: string | null,"featured"?: boolean | null,"id"?: string | null,"is_open"?: never,"lat"?: number | null,"legal_name"?: string | null,"lng"?: number | null,"logo_url"?: string | null,"manual_closed"?: boolean | null,"min_order"?: number | null,"name"?: string | null,"owner_id"?: string | null,"phone"?: string | null,"prep_max"?: number | null,"prep_min"?: number | null,"rating_avg"?: number | null,"rating_count"?: number | null,"review_notes"?: string | null,"slug"?: string | null,"status"?: Database["public"]['Enums']["merchant_status"] | null,"tagline"?: string | null,"tags"?: (string)[] | null,"tax_id"?: string | null,"updated_at"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "merchants_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "merchants_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "merchants_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"order_summary": {
                  Row: {
                    "accepted_at": string | null,"address_snapshot": Json | null,"assigned_at": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"city_id": string | null,"city_name": string | null,"commission_amount": number | null,"commission_rate": number | null,"coupon_id": string | null,"courier_id": string | null,"courier_name": string | null,"courier_payout": number | null,"courier_phone": string | null,"created_at": string | null,"customer_id": string | null,"customer_name": string | null,"customer_phone": string | null,"delivered_at": string | null,"delivery_code": string | null,"delivery_fee": number | null,"delivery_lat": number | null,"delivery_lng": number | null,"discount": number | null,"eta_max": number | null,"eta_min": number | null,"gateway_fee": number | null,"id": string | null,"items_count": number | null,"items_subtotal": number | null,"merchant_category": Database["public"]['Enums']["merchant_category"] | null,"merchant_id": string | null,"merchant_logo": string | null,"merchant_name": string | null,"merchant_payout": number | null,"notes": string | null,"number": number | null,"package_details": Json | null,"payment_method": Database["public"]['Enums']["payment_method"] | null,"payment_method_id": string | null,"payment_status": Database["public"]['Enums']["payment_status"] | null,"picked_up_at": string | null,"pickup_snapshot": Json | null,"placed_at": string | null,"ready_at": string | null,"service_fee": number | null,"status": Database["public"]['Enums']["order_status"] | null,"total": number | null,"type": Database["public"]['Enums']["order_type"] | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "orders_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_summary"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "orders_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_courier_id_fkey"
      columns: ["courier_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchant_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_payment_method_id_fkey"
      columns: ["payment_method_id"]
isOneToOne: false
      referencedRelation: "payment_methods"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_accept_invitation":
{ Args: { "p_token": string }; Returns: {
              "accepted_at": string | null,
"created_at": string,
"invited_at": string | null,
"invited_by": string | null,
"role": Database["public"]['Enums']["admin_role"],
"status": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "admin_users"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_generate_settlements":
{ Args: { "p_end": string,"p_start": string }; Returns: number
                           },
"admin_invite":
{ Args: { "p_email": string,"p_role": Database["public"]['Enums']["admin_role"] }; Returns: {
              "accepted_at": string | null,
"created_at": string,
"email": string,
"expires_at": string,
"id": string,
"invited_by": string | null,
"role": Database["public"]['Enums']["admin_role"],
"token": string
            }
                          SetofOptions: {
        from: "*"
        to: "admin_invitations"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_merchant_stats":
{ Args: { "p_days"?: number }; Returns: {
              "avg_prep_min": number,"cancelled_30d": number,"merchant_id": string,"orders_30d": number,"sales_30d": number
            }[]
                           },
"admin_order_action":
{ Args: { "p_action": string,"p_order_id": string,"p_reason": string,"p_status"?: Database["public"]['Enums']["order_status"] }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_overview":
{ Args: { "p_city"?: string,"p_from"?: string,"p_to"?: string }; Returns: Json
                           },
"admin_report":
{ Args: { "p_city"?: string,"p_from": string,"p_to": string }; Returns: Json
                           },
"admin_set_courier_status":
{ Args: { "p_id": string,"p_reason": string,"p_status": Database["public"]['Enums']["courier_status"] }; Returns: {
              "balance": number,
"bank_account": Json | null,
"city_id": string | null,
"created_at": string,
"current_lat": number | null,
"current_lng": number | null,
"deliveries_count": number,
"document_number": string | null,
"is_online": boolean,
"last_seen_at": string | null,
"plate": string | null,
"rating_avg": number,
"rating_count": number,
"review_notes": string | null,
"status": Database["public"]['Enums']["courier_status"],
"updated_at": string,
"user_id": string,
"vehicle": Database["public"]['Enums']["vehicle_type"]
            }
                          SetofOptions: {
        from: "*"
        to: "couriers"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_set_merchant_status":
{ Args: { "p_id": string,"p_reason": string,"p_status": Database["public"]['Enums']["merchant_status"] }; Returns: {
              "accepts_orders": boolean,
"address": string | null,
"bank_account": Json | null,
"category": Database["public"]['Enums']["merchant_category"],
"city_id": string | null,
"commission_rate": number,
"cover_url": string | null,
"created_at": string,
"delivery_fee": number,
"description": string | null,
"featured": boolean,
"id": string,
"lat": number | null,
"legal_name": string | null,
"lng": number | null,
"logo_url": string | null,
"manual_closed": boolean,
"min_order": number,
"name": string,
"owner_id": string | null,
"phone": string | null,
"prep_max": number,
"prep_min": number,
"rating_avg": number,
"rating_count": number,
"review_notes": string | null,
"slug": string,
"status": Database["public"]['Enums']["merchant_status"],
"tagline": string | null,
"tags": (string)[],
"tax_id": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "merchants"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_settlement_transition":
{ Args: { "p_id": string,"p_reason": string,"p_reference"?: string,"p_status": Database["public"]['Enums']["settlement_status"] }; Returns: {
              "adjustments": number,
"approval_reason": string | null,
"approved_at": string | null,
"approved_by": string | null,
"bank_snapshot": Json | null,
"commissions": number,
"created_at": string,
"gross": number,
"id": string,
"net": number,
"notes": string | null,
"orders_count": number,
"paid_at": string | null,
"paid_by": string | null,
"payee_id": string,
"payee_type": Database["public"]['Enums']["payee_type"],
"payment_reference": string | null,
"period_end": string,
"period_start": string,
"status": Database["public"]['Enums']["settlement_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "settlements"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_withdrawal_transition":
{ Args: { "p_id": string,"p_reason": string,"p_reference"?: string,"p_status": Database["public"]['Enums']["settlement_status"] }; Returns: {
              "amount": number,
"bank_snapshot": Json | null,
"courier_id": string,
"created_at": string,
"id": string,
"processed_at": string | null,
"processed_by": string | null,
"reference": string | null,
"status": Database["public"]['Enums']["settlement_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "courier_withdrawals"
        isOneToOne: true
        isSetofReturn: false
      } },
"audit":
{ Args: { "p_action": string,"p_after": Json,"p_before": Json,"p_entity": string,"p_entity_id": string,"p_reason": string }; Returns: undefined
                           },
"cancel_order":
{ Args: { "p_order_id": string,"p_reason": string }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"confirm_payment":
{ Args: { "p_amount": number,"p_gateway_fee"?: number,"p_order_id": string,"p_provider": string,"p_provider_ref": string,"p_raw"?: Json,"p_status": Database["public"]['Enums']["payment_status"] }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"courier_accept_order":
{ Args: { "p_order_id": string }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"courier_available_orders":
{ Args: { "p_lat"?: number,"p_lng"?: number,"p_radius_km"?: number }; Returns: {
              "courier_payout": number,"delivery_address": Json,"delivery_lat": number,"delivery_lng": number,"distance_km": number,"id": string,"merchant_address": string,"merchant_lat": number,"merchant_lng": number,"merchant_name": string,"number": number,"placed_at": string,"status": Database["public"]['Enums']["order_status"],"total": number,"type": Database["public"]['Enums']["order_type"]
            }[]
                           },
"courier_dashboard":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"courier_set_order_status":
{ Args: { "p_delivery_code"?: string,"p_order_id": string,"p_status": Database["public"]['Enums']["order_status"] }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"courier_submit_for_review":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"courier_update_location":
{ Args: { "p_lat": number,"p_lng": number,"p_order_id"?: string }; Returns: undefined
                           },
"coverage_for":
{ Args: { "p_lat": number,"p_lng": number }; Returns: {
              "base_delivery_fee": number,"city_id": string,"city_name": string,"distance_km": number,"zone_id": string,"zone_name": string
            }[]
                           },
"current_admin_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["admin_role"]
                           },
"dearmor":
{ Args: { "": string }; Returns: string
                           },
"expire_pending_payments":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"gen_random_uuid":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"gen_salt":
{ Args: { "": string }; Returns: string
                           },
"generate_owner_alerts":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"has_admin_role":
{ Args: { "roles": (Database["public"]['Enums']["admin_role"])[] }; Returns: boolean
                           },
"haversine_km":
{ Args: { "lat1": number,"lat2": number,"lng1": number,"lng2": number }; Returns: number
                           },
"invitation_preview":
{ Args: { "p_token": string }; Returns: {
              "accepted": boolean,"email": string,"expires_at": string,"role": Database["public"]['Enums']["admin_role"]
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_courier":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_merchant_member":
{ Args: { "m": string }; Returns: boolean
                           },
"is_owner":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_notifications_read":
{ Args: { "p_ids"?: (number)[] }; Returns: undefined
                           },
"merchant_dashboard":
{ Args: { "p_from"?: string,"p_merchant": string }; Returns: Json
                           },
"merchant_is_open":
{ Args: { "m": Omit<Database["public"]['Tables']["merchants"]['Row'], Database["public"]['Tables']["merchants"]['ComputedFields']> }; Returns: boolean
                           },
"merchant_set_order_status":
{ Args: { "p_eta_min"?: number,"p_order_id": string,"p_status": Database["public"]['Enums']["order_status"] }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"my_merchant_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"nearby_merchants":
{ Args: { "p_category"?: Database["public"]['Enums']["merchant_category"],"p_lat": number,"p_lng": number,"p_radius_km"?: number }; Returns: {
              "category": Database["public"]['Enums']["merchant_category"],"cover_url": string,"delivery_fee": number,"distance_km": number,"featured": boolean,"id": string,"is_open": boolean,"logo_url": string,"name": string,"prep_max": number,"prep_min": number,"rating_avg": number,"rating_count": number,"slug": string,"tagline": string,"tags": (string)[]
            }[]
                           },
"owner_daily_summary":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"pgp_armor_headers":
{ Args: { "": string }; Returns: Record<string, unknown>[]
                           },
"place_order":
{ Args: { "p_address_id": string,"p_coupon_code"?: string,"p_items": Json,"p_merchant_id": string,"p_notes"?: string,"p_payment_method"?: Database["public"]['Enums']["payment_method"],"p_payment_method_id"?: string }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"place_shipment":
{ Args: { "p_dropoff": Json,"p_notes"?: string,"p_package": Json,"p_payment_method"?: Database["public"]['Enums']["payment_method"],"p_pickup": Json }; Returns: {
              "accepted_at": string | null,
"address_snapshot": NonNullable<Json>,
"assigned_at": string | null,
"cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"city_id": string | null,
"commission_amount": number,
"commission_rate": number,
"coupon_id": string | null,
"courier_id": string | null,
"courier_payout": number,
"created_at": string,
"customer_id": string,
"delivered_at": string | null,
"delivery_code": string,
"delivery_fee": number,
"delivery_lat": number | null,
"delivery_lng": number | null,
"discount": number,
"eta_max": number | null,
"eta_min": number | null,
"gateway_fee": number,
"id": string,
"items_subtotal": number,
"merchant_id": string | null,
"merchant_payout": number,
"notes": string | null,
"number": number,
"package_details": Json | null,
"payment_method": Database["public"]['Enums']["payment_method"],
"payment_method_id": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"picked_up_at": string | null,
"pickup_snapshot": Json | null,
"placed_at": string,
"ready_at": string | null,
"service_fee": number,
"status": Database["public"]['Enums']["order_status"],
"total": number,
"type": Database["public"]['Enums']["order_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"register_courier":
{ Args: { "p": Json }; Returns: {
              "balance": number,
"bank_account": Json | null,
"city_id": string | null,
"created_at": string,
"current_lat": number | null,
"current_lng": number | null,
"deliveries_count": number,
"document_number": string | null,
"is_online": boolean,
"last_seen_at": string | null,
"plate": string | null,
"rating_avg": number,
"rating_count": number,
"review_notes": string | null,
"status": Database["public"]['Enums']["courier_status"],
"updated_at": string,
"user_id": string,
"vehicle": Database["public"]['Enums']["vehicle_type"]
            }
                          SetofOptions: {
        from: "*"
        to: "couriers"
        isOneToOne: true
        isSetofReturn: false
      } },
"register_merchant":
{ Args: { "p": Json }; Returns: {
              "accepts_orders": boolean,
"address": string | null,
"bank_account": Json | null,
"category": Database["public"]['Enums']["merchant_category"],
"city_id": string | null,
"commission_rate": number,
"cover_url": string | null,
"created_at": string,
"delivery_fee": number,
"description": string | null,
"featured": boolean,
"id": string,
"lat": number | null,
"legal_name": string | null,
"lng": number | null,
"logo_url": string | null,
"manual_closed": boolean,
"min_order": number,
"name": string,
"owner_id": string | null,
"phone": string | null,
"prep_max": number,
"prep_min": number,
"rating_avg": number,
"rating_count": number,
"review_notes": string | null,
"slug": string,
"status": Database["public"]['Enums']["merchant_status"],
"tagline": string | null,
"tags": (string)[],
"tax_id": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "merchants"
        isOneToOne: true
        isSetofReturn: false
      } },
"request_withdrawal":
{ Args: { "p_amount": number }; Returns: {
              "amount": number,
"bank_snapshot": Json | null,
"courier_id": string,
"created_at": string,
"id": string,
"processed_at": string | null,
"processed_by": string | null,
"reference": string | null,
"status": Database["public"]['Enums']["settlement_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "courier_withdrawals"
        isOneToOne: true
        isSetofReturn: false
      } },
"search_catalog":
{ Args: { "p_city"?: string,"p_q": string }; Returns: {
              "id": string,"image_url": string,"kind": string,"merchant_id": string,"name": string,"price": number,"rating": number,"subtitle": string
            }[]
                           },
"setting_int":
{ Args: { "dflt": number,"k": string }; Returns: number
                           },
"show_limit":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"show_trgm":
{ Args: { "": string }; Returns: (string)[]
                           },
"uuid_generate_v1":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"uuid_generate_v1mc":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"uuid_generate_v3":
{ Args: { "name": string,"namespace": string }; Returns: string
                           },
"uuid_generate_v4":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"uuid_generate_v5":
{ Args: { "name": string,"namespace": string }; Returns: string
                           },
"uuid_nil":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"uuid_ns_dns":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"uuid_ns_oid":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"uuid_ns_url":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"uuid_ns_x500":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            "admin_role": "owner"|"finance"|"operations"|"support","app_role": "customer"|"merchant"|"courier"|"admin","coupon_type": "percent"|"fixed"|"free_delivery","courier_status": "pending"|"under_review"|"active"|"suspended","document_status": "pending"|"approved"|"rejected","merchant_category": "food"|"market"|"pharmacy","merchant_status": "pending"|"under_review"|"active"|"paused"|"rejected"|"suspended","order_status": "pending_payment"|"placed"|"accepted"|"preparing"|"ready"|"assigned"|"picked_up"|"on_the_way"|"delivered"|"cancelled","order_type": "food"|"market"|"pharmacy"|"shipment","payee_type": "merchant"|"courier","payment_method": "cash"|"card"|"pse"|"nequi"|"daviplata","payment_status": "pending"|"authorized"|"paid"|"failed"|"refunded","product_status": "draft"|"published"|"paused","settlement_status": "pending"|"approved"|"paid"|"rejected","support_status": "open"|"in_progress"|"resolved"|"closed","vehicle_type": "moto"|"bicicleta"|"carro"|"a_pie"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "admin_role": ["owner", "finance", "operations", "support"],"app_role": ["customer", "merchant", "courier", "admin"],"coupon_type": ["percent", "fixed", "free_delivery"],"courier_status": ["pending", "under_review", "active", "suspended"],"document_status": ["pending", "approved", "rejected"],"merchant_category": ["food", "market", "pharmacy"],"merchant_status": ["pending", "under_review", "active", "paused", "rejected", "suspended"],"order_status": ["pending_payment", "placed", "accepted", "preparing", "ready", "assigned", "picked_up", "on_the_way", "delivered", "cancelled"],"order_type": ["food", "market", "pharmacy", "shipment"],"payee_type": ["merchant", "courier"],"payment_method": ["cash", "card", "pse", "nequi", "daviplata"],"payment_status": ["pending", "authorized", "paid", "failed", "refunded"],"product_status": ["draft", "published", "paused"],"settlement_status": ["pending", "approved", "paid", "rejected"],"support_status": ["open", "in_progress", "resolved", "closed"],"vehicle_type": ["moto", "bicicleta", "carro", "a_pie"]
          }
        }
} as const
