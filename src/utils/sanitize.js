export function publicProvider(provider) {
  return {
    id: provider._id,
    name: provider.name,
    photoUrl: provider.photoUrl || null,
    phoneMasked: provider.phone ? provider.phone.replace(/(\+?\d{2})\d+(\d{4})$/, '$1••••••$2') : null,
    rating: provider.rating,
    completedJobs: provider.completedJobs,
    experienceYears: provider.experienceYears,
    verified: provider.verified,
    skills: provider.skills,
    languages: provider.languages,
    serviceVehicle: provider.serviceVehicle || null,
    verification: provider.verification
  };
}

export function providerForAssignedCustomer(provider) {
  return {
    ...publicProvider(provider),
    phone: provider.phone || null
  };
}
