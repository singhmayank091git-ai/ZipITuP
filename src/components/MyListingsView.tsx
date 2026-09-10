                      {activeTab === 'my-listings' && (
                        <MyListingsView
                          listings={companyListings}
                          onNavigateToPost={() => setActiveTab('post-listing')}
                        />
                      )}
