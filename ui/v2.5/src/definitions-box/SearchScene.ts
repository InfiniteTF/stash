/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, EthnicityEnum, EyeColorEnum, HairColorEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL query operation: SearchScene
// ====================================================

export interface SearchScene_searchScene_urls {
  url: string;
}

export interface SearchScene_searchScene_studio {
  name: string;
  id: string;
}

export interface SearchScene_searchScene_tags {
  name: string;
  id: string;
}

export interface SearchScene_searchScene_performers_performer_urls {
  url: string;
}

export interface SearchScene_searchScene_performers_performer_birthdate {
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SearchScene_searchScene_performers_performer_measurements {
  band_size: number | null;
  cup_size: string | null;
  waist: number | null;
  hip: number | null;
}

export interface SearchScene_searchScene_performers_performer_tattoos {
  location: string;
  description: string | null;
}

export interface SearchScene_searchScene_performers_performer_piercings {
  location: string;
  description: string | null;
}

export interface SearchScene_searchScene_performers_performer {
  id: string;
  name: string;
  disambiguation: string | null;
  aliases: string[];
  gender: GenderEnum | null;
  urls: SearchScene_searchScene_performers_performer_urls[];
  birthdate: SearchScene_searchScene_performers_performer_birthdate | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  eye_color: EyeColorEnum | null;
  hair_color: HairColorEnum | null;
  /**
   * Height in cm
   */
  height: number | null;
  measurements: SearchScene_searchScene_performers_performer_measurements;
  breast_type: BreastTypeEnum | null;
  career_start_year: number | null;
  career_end_year: number | null;
  tattoos: SearchScene_searchScene_performers_performer_tattoos[] | null;
  piercings: SearchScene_searchScene_performers_performer_piercings[] | null;
}

export interface SearchScene_searchScene_performers {
  /**
   * Performing as alias
   */
  as: string | null;
  performer: SearchScene_searchScene_performers_performer;
}

export interface SearchScene_searchScene_fingerprints {
  algorithm: FingerprintAlgorithm;
  hash: string;
}

export interface SearchScene_searchScene {
  id: string;
  title: string | null;
  details: string | null;
  date: any | null;
  urls: SearchScene_searchScene_urls[];
  studio: SearchScene_searchScene_studio | null;
  tags: SearchScene_searchScene_tags[];
  performers: SearchScene_searchScene_performers[];
  fingerprints: SearchScene_searchScene_fingerprints[];
}

export interface SearchScene {
  searchScene: (SearchScene_searchScene | null)[];
}

export interface SearchSceneVariables {
  term: string;
}