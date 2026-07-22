import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Collection} from '../models';
import {collectionsService} from '../services/collectionsService';

interface CollectionsContextType {
  collections: Collection[];
  activeCollection: Collection | null;
  setActiveCollection: (collection: Collection | null) => void;
  refreshCollections: () => Promise<void>;
  totalRecipeCount: number;
  setTotalRecipeCount: (count: number) => void;
}

const CollectionsContext = createContext<CollectionsContextType>({
  collections: [],
  activeCollection: null,
  setActiveCollection: () => {},
  refreshCollections: async () => {},
  totalRecipeCount: 0,
  setTotalRecipeCount: () => {},
});

export function CollectionsProvider({children}: {children: React.ReactNode}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(
    null,
  );
  const [totalRecipeCount, setTotalRecipeCount] = useState(0);

  const refreshCollections = useCallback(async () => {
    try {
      const data = await collectionsService.fetchCollections();
      setCollections(data);
    } catch {
      // silently fail — user sees stale list, can pull-to-refresh
    }
  }, []);

  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        activeCollection,
        setActiveCollection,
        refreshCollections,
        totalRecipeCount,
        setTotalRecipeCount,
      }}>
      {children}
    </CollectionsContext.Provider>
  );
}

export const useCollections = () => useContext(CollectionsContext);
