import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useMemo } from 'react';
import { MapPin as MapPinType, Property } from '../../types';
import L from 'leaflet';

export function useBolgemPins(
  profileId: string | undefined,
  mapCenter: { lat: number; lng: number },
  userLocation: { lat: number; lng: number } | null,
  filter: string,
  search: string
) {
  const { data: pins = [], isLoading: isLoadingPins } = useQuery({
    queryKey: [QUERY_KEYS.MAP_PINS, profileId],
    queryFn: api.getMapPins,
    enabled: !!profileId
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', profileId],
    queryFn: api.getProperties,
    enabled: !!profileId
  });

  const combinedPins = useMemo(() => {
    const propPins: MapPinType[] = properties
      .filter((p: Property) => typeof p.address?.lat === 'number' && isFinite(p.address.lat) && typeof p.address?.lng === 'number' && isFinite(p.address.lng))
      .map((p: Property) => {
      const lat = p.address!.lat!;
      const lng = p.address!.lng!;

      return {
        id: `prop-${p.id}`,
        user_id: p.user_id,
        lat,
        lng,
        type: 'portfoy',
        title: `🏠 ${p.title}`,
        address: `${p.address?.neighborhood || ''}, ${p.address?.district || ''}/${p.address?.city || ''}`,
        notes: `Fiyat: ${p.price?.toLocaleString('tr-TR')} TL | Durum: ${p.status} | Tip: ${p.type}`,
        created_at: p.created_at
      };
    });

    return [...pins, ...propPins];
  }, [pins, properties, mapCenter]);

  const filteredPins = useMemo(() => {
    return combinedPins.filter((pin: MapPinType) => {
      let matchFilter = false;
      if (filter === 'all') {
        matchFilter = true;
      } else if (filter === 'nearby') {
        if (userLocation && typeof pin.lat === 'number' && typeof pin.lng === 'number') {
          try {
            const dist = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(pin.lat, pin.lng));
            matchFilter = dist <= 2000;
          } catch (e) {
            console.error("Distance calculation error:", e);
            matchFilter = false;
          }
        } else {
          matchFilter = false; 
        }
      } else {
        matchFilter = pin.type === filter;
      }

      const matchSearch = (pin.title || '').toLowerCase().includes(search.toLowerCase()) || (pin.address || '').toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [filter, search, combinedPins, userLocation]);

  return { pins, properties, isLoadingPins, isLoadingProperties, combinedPins, filteredPins };
}
