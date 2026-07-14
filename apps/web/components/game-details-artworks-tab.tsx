'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { getGameByIgdbId } from '@/lib/services/game.service';
import Image from 'next/image';
import { Card } from '@workspace/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/dialog';
import {
  IconLayersIntersect,
  IconExternalLink,
  IconBrush,
} from '@tabler/icons-react';
import { type ArtworkImage } from '@workspace/api-contract';
import { artStylesQueryOptions } from '@/lib/services/art-style.service';

export default function GameDetailsArtworksTab({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const { data: artStyles } = useSuspenseQuery(artStylesQueryOptions);

  const artworks = game.artworks as ArtworkImage[] | null;

  return (
    <div className="space-y-10">
      {artworks && artworks.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-md font-black uppercase tracking-widest border-l-4 border-primary pl-4 flex items-center gap-2">
            <IconLayersIntersect aria-hidden="true" size={20} />
            Artworks {artworks.length}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artworks.map((art: ArtworkImage, index: number) => (
              <Dialog key={`${art.image_id}-${index}`}>
                <DialogTrigger
                  nativeButton={false}
                  render={
                    <Card className="overflow-hidden border-2 rounded-none bg-muted/20 group cursor-pointer hover:border-primary/50 transition-colors p-0">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={art.url
                            .replace('t720p', 't1080p')
                            .replace('.jpg', '.png')}
                          alt={`${game.name} artwork ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <IconExternalLink
                            aria-hidden="true"
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-5"
                          />
                        </div>
                      </div>
                    </Card>
                  }
                />
                <DialogContent className="fixed! inset-0! m-auto! translate-x-0! translate-y-0! max-w-4xl w-full aspect-video p-0 overflow-hidden bg-transparent border-none ring-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>
                      {game.name} Artwork {index + 1}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="relative w-full h-full">
                    <Image
                      src={art.url
                        .replace('t720p', 'toriginal')
                        .replace('.jpg', '.png')}
                      alt={`${game.name} artwork ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(game.imageGen) && game.imageGen.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-md font-black uppercase tracking-widest border-l-4 border-primary pl-4 flex items-center gap-2">
            <IconBrush aria-hidden="true" size={20} />
            Image Gen History ({game.imageGen.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {game.imageGen.map((entry, index) => {
              if (!entry || typeof entry !== 'object') {
                return null;
              }

              const keys = Object.keys(entry);

              if (keys.length === 0) {
                return null;
              }

              const styleKey = keys[0];
              const data = entry[styleKey];

              if (!data || typeof data !== 'object') {
                return null;
              }

              const styleLabel =
                artStyles.find((s) => s.value === styleKey)?.label ?? styleKey;

              return (
                <Dialog key={index}>
                  <DialogTrigger
                    nativeButton={false}
                    render={
                      <div className="group relative aspect-square w-full cursor-pointer overflow-hidden border bg-muted/20 hover:border-primary/50 transition-colors">
                        <Image
                          src={data.url}
                          alt={`${game.name} - ${styleLabel}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 200px"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white text-[10px]">
                          <p className="font-bold truncate">{styleLabel}</p>
                          <p className="opacity-70">{data.provider}</p>
                        </div>
                      </div>
                    }
                  />
                  <DialogContent className="fixed! inset-0! m-auto! translate-x-0! translate-y-0! max-w-2xl w-full aspect-square p-0 overflow-hidden bg-transparent border-none ring-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>
                        {game.name} - {styleLabel}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-full">
                      <Image
                        src={data.url}
                        alt={`${game.name} - ${styleLabel}`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 896px) 100vw, 896px"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
