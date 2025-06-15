import { prisma } from '../models/prisma';

export const unlinkGoogleAccount = async (userId: number) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { googleId: null },
  });
};

export const unlinkFacebookAccount = async (userId: number) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { facebookId: null },
  });
};

export const linkGoogleAccount = async (userId: number, googleId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { googleId },
  });
};

export const linkFacebookAccount = async (userId: number, facebookId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { facebookId },
  });
};
